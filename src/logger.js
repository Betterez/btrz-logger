const logCleaner = require("./log-cleaner");
const util = require("util");
const process = require("process");

function isString(value) {
  return value && value.toLowerCase;
}

function getStackTrace () {
  let stack = new Error().stack || '';
  stack = stack.split('\n').map(function (line) { return line.trim(); });
  return stack.splice(stack[0] == 'Error' ? 2 : 1);
}

function serialize(value) {
  if (Array.isArray(value)) {
    return value
      .filter(item => item !== undefined && item !== null)
      .map(serialize)
      .join("\n");
  }

  if (typeof value === "string" || typeof value === "number") {
    return value;
  } else if (!value) {
    return "";
  } else if (value.stack) {
    // value is an error-like object
    return "\n" + util.inspect(value);
  } else {
    return util.inspect(value, {showHidden: true, depth: 4, breakLength: Infinity});
  }
}

function buildMessage(level, msg, args, options, location) {
  let _msg = msg,
    _args = args;

  if (!isString(msg) && isString(args)) {
    _args = msg;
    _msg = args;
  }

  if (!isString(msg) && !isString(args)) {
    _args = [msg, args];
    _msg = "";
  }

  if (!Array.isArray(_args)) {
    _args = [_args];
  }

  _args = logCleaner.sanitize(_args);

  const serializedData = serialize(_args);
  const tokens = {
    date: new Date().toISOString(),
    level: level,
    message: logCleaner.sanitizeUrlRawParameters(_msg),
    serverId: options && options.serverId ? `${options.serverId}#${process.pid}` : "",
    traceId: options && options.traceId ? options.traceId : "",
    data: serializedData,
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

  constructor(options) {
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
    if (logger.error && logger.error.apply) {
      this.loggers.push(logger);
    } else {
      let loggerOptions = this.options.loggers[logger];
      this.loggers.push(require("./providers/" + loggerOptions.provider).create(loggerOptions.options));
    }
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
