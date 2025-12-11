const assert = require("node:assert");
const process = require("node:process");
const logCleaner = require("./log-cleaner");
const {trace: otlpTrace} = require("@opentelemetry/api");

function isString(value) {
  return value && value.toLowerCase;
}

function getStackTrace () {
  let stack = new Error().stack || '';
  stack = stack.split('\n').map(function (line) { return line.trim(); });
  return stack.splice(stack[0] == 'Error' ? 2 : 1);
}

let _dateOfPreviousLogLine = null;
let _numberOfOtherLogsUsingThisDate = 0;

/* Some logging systems will de-duplicate log lines which have exactly the same content and timestamp (date).
 * We don't want any of our logs to be de-duplicated, because we would effectively lose those logs.  To prevent
 * de-duplication, when there are multiple log lines emitted within the same millisecond window, we add a fake number
 * of nanoseconds to the timestamp of each log line.  This ensures that each log line has a unique timestamp,
 * preventing de-duplication.
 */
function getUniqueDate() {
  const date = new Date().toISOString();

  if (_dateOfPreviousLogLine === date) {
    _numberOfOtherLogsUsingThisDate++;
  } else {
    _numberOfOtherLogsUsingThisDate = 0;
  }

  _dateOfPreviousLogLine = date;
  return `${date.slice(0, -1)}${_numberOfOtherLogsUsingThisDate.toString().padStart(6, "0")}Z`;
}

function buildMessage(level, msg, data, options) {
  let _msg = msg,
    _data = data;

  if (!isString(msg) && isString(data)) {
    _data = msg;
    _msg = data;
  }

  if (!isString(msg) && !isString(data)) {
    if (msg !== null && msg !== undefined && data !== null && data !== undefined) {
      _data = [msg, data];
    } else if (msg !== null && msg !== undefined) {
      _data = msg;
    }

    _msg = "";
  }

  const tokens = {
    date: getUniqueDate(),
    level,
    message: logCleaner.sanitizeUrlRawParameters(_msg),
    serverId: options.serverId ? `${options.serverId}#${process.pid}` : `localhost#${process.pid}`,
    traceId: options.traceId || "-",
    grafanaTraceId: otlpTrace.getActiveSpan()?.spanContext().traceId || "",
    data: logCleaner.sanitize(_data),
    location: getStackTrace()
  };
  return tokens;
}

class Logger {
  static LogLevel() {
    return {
      DEBUG: "debug",
      INFO: "info",
      ERROR: "error",
      FATAL: "fatal"
    }
  }

  constructor(options = {}) {
    this.options = options;
    this.loggers = [];
    this.level = options && options.level ? options.level : "debug";
    this.levels = {debug: 0, info: 1, error: 2, fatal: 3};
  }

  // For parity with the Stream interface (stream.write)
  write(...args) {
    this.loggers.forEach((logger) => {
      // Delegate the call to the concrete logger classes
      logger.write(...args);
    });
  }

  _log(tokens) {
    this.loggers.forEach((logger) => {
      logger.log(tokens);
    });
  }

  setLevel(minLevel) {
    this.level = minLevel;
  }

  getLevel() {
    return this.level;
  }

  getLoggers() {
    return this.loggers;
  }

  addLogger(logger) {
    assert(logger.error?.apply, "The provided logger does not implement the error() method.");

    this.loggers.push(logger);
    // Return 'this' for chaining
    return this;
  }

  clearLoggers() {
    this.loggers = [];
  }

  // Level ? :-)
  log(level, msg, args) {
    if (this.levels[this.getLevel()] <= this.levels[level]) {
      this._log(buildMessage(level, msg, args, this.options));
    }
  }

  // Level 0
  debug(msg, args) {
    if (this.levels[this.getLevel()] <= 0) {
      this._log(buildMessage("debug", msg, args, this.options));
    }
  }

  // Level 1
  info(msg, args) {
    if (this.levels[this.getLevel()] <= 1) {
      this._log(buildMessage("info", msg, args, this.options));
    }
  }

  // Level 2
  error(msg, args) {
    if (this.levels[this.getLevel()] <= 2) {
      this._log(buildMessage("error", msg, args, this.options));
    }
  }

  // Level 3
  fatal(msg, args) {
    if (this.levels[this.getLevel()] <= 3) {
      this._log(buildMessage("fatal", msg, args, this.options));
    }
  }
}

module.exports = {Logger};
