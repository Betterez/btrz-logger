const assert = require("node:assert");
const cluster = require("node:cluster");
const fs = require("node:fs");
const path = require("node:path");
const RotatingFileStream = require("rotating-file-stream");
const {format} = require("./console-logger");
const logCleaner = require("./log-cleaner");

const MAX_HOURS_TO_KEEP_LOG_FILES = 24;
const MILLISECONDS_PER_HOUR = 60 * 60 * 1000;

function removeOldLogFiles(logDirectory, logName) {
  // When the process is terminated and then restarted, the 'rotating-file-stream' package will not automatically
  // clean up log files which were left over from the previous execution.
  // Manually remove log files which are too old.
  if (!fs.existsSync(logDirectory)) {
    return;
  }

  const logDirectoryContents = fs.readdirSync(logDirectory);
  const currentTime = new Date().getTime();

  for (const relativePath of logDirectoryContents) {
    const absolutePath = path.join(logDirectory, relativePath);
    const stats = fs.statSync(absolutePath);

    if (!stats.isFile()) {
      // eslint-disable-next-line no-continue
      continue;
    }

    if (!absolutePath.endsWith(`${logName}.log`)) {
      // Ignore files which don't look like log files.  The 'rotating-file-stream' package may add other files to
      // the log directory to persist its own state.  We shouldn't touch these.
      // eslint-disable-next-line no-continue
      continue;
    }

    const fileAgeInHours = (currentTime - stats.birthtime.getTime()) / MILLISECONDS_PER_HOUR;
    if (fileAgeInHours > MAX_HOURS_TO_KEEP_LOG_FILES) {
      console.log(`Removing old log file (${Math.trunc(fileAgeInHours * 10) / 10} hours old): ${relativePath}`);
      fs.rmSync(absolutePath);
    }
  }
}


class RotatingFileLogger {
  constructor(options = {}) {
    const {logName, logDirectory, sanitize, addNewlines = true, colorize = true} = options;

    assert(logName, "You must provide a \"logName\"");
    assert(logDirectory, "You must provide a \"logDirectory\"");
    assert(typeof sanitize === "boolean", "You must declare whether or not to sanitize logs");

    this.addNewlines = addNewlines;
    this.sanitize = sanitize;
    this.colorize = colorize;

    if (cluster.isMaster) {
      removeOldLogFiles(logDirectory, logName);
    }

    const logFileNameProvider = (date, index) => {
      if (!date) {
        return `${logName}.log`;
      }

      const _date = new Date(date);
      _date.setMinutes(0);
      _date.setSeconds(0);
      _date.setMilliseconds(0);

      const dateBucket = _date.toISOString()
        .replace("T", "_UTC_")
        .replace("Z", "")
        .replace(".000", "");

      return `${dateBucket}_${index}-${logName}.log`;
    };

    this.stream = RotatingFileStream.createStream(logFileNameProvider, {
      size: "300M",
      maxSize: "1G",
      maxFiles: MAX_HOURS_TO_KEEP_LOG_FILES,
      interval: "1h",
      path: logDirectory,
      immutable: true,
      history: `${logName}-log-file-history.txt`
    });
  }

  log(tokens) {
    this.stream.write(`${format(tokens, this.colorize)}${this.addNewlines ? "\n" : ""}`);
  }

  // Used for Express logger
  write(stringValue) {
    let valueToWrite = stringValue;

    if (this.sanitize) {
      valueToWrite = logCleaner.sanitizeUrlRawParameters(stringValue);
    }
    this.stream.write(`${valueToWrite}${this.addNewlines ? "\n" : ""}`);
  }
}

// For backwards compatibility
RotatingFileLogger.prototype.error = RotatingFileLogger.prototype.log;

module.exports = {
  RotatingFileLogger
};
