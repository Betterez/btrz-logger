const logCleaner = require("./log-cleaner");
const util = require("util");
const color = require("ansi-color").set;
const colorFromLevel = {
  info: "yellow",
  debug: "blue",
  error: "red",
  fatal: "red_bg+white"
};

function serialize(value) {
  if (Array.isArray(value)) {
    return value
      .map(serialize)
      .join("\n");
  }

  if (typeof value === "string" || typeof value === "number") {
    return value;
  } else if (!value) {
    return util.inspect(value);
  } else if (value.stack) {
    // value is an error-like object
    return "\n" + util.inspect(value);
  } else {
    return "\n" + util.inspect(value, {showHidden: true, depth: 4, compact: false, breakLength: Infinity});
  }
}

class ConsoleLogger {
  constructor(options = {}) {
    this.colorize = options.colorize ?? true;
  }

  log(tokens) {
    let msg = `${tokens.level.toUpperCase()}\t${tokens.date} \t${tokens.serverId}\t${tokens.traceId}`;

    if (tokens.message) {
      msg += `\t${tokens.message}`;
    }
    if (tokens.data !== undefined && tokens.data !== "") {
      msg += `\t${serialize(tokens.data)}`;
    }

    const output = this.colorize ? color(msg, colorFromLevel[tokens.level.toLowerCase()]) : msg;
    console.log(output);
  }

  // Used for Express logger
  write(buf) {
    let cleanBuf = logCleaner.sanitizeUrlRawParameters(buf);
    console.log(cleanBuf);
  }
}

// For backwards compatibility
ConsoleLogger.prototype.error = ConsoleLogger.prototype.log;

exports.ConsoleLogger = ConsoleLogger;
