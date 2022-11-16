"use strict";
const logCleaner = require("./log-cleaner");
const util = require("util");
const process = require("process");
const incomingMessage = require("http").IncomingMessage;

function isString(value) {
  return value && value.toLowerCase;
}

function serialize(results, args) {
  if (!args) {
    return results;
  }
  if (Array.isArray(args)) {
    args.forEach(function (a) {
      serialize(results, a);
    });
    return results;
  }
  if (args.stack) {
    results.push(args.stack.split("\n"));
  } else if (args instanceof incomingMessage) {
    results.push(util.inspect(args.headers, {showHidden: true, depth: 4}) + "\n");
    results.push(util.inspect(args.body, {showHidden: true, depth: 4}) + "\n");
  } else if (Object.keys(args).length > 0) {
    results.push(util.inspect(args, {showHidden: true, depth: 4}) + "\n");
  } else {
    results.push(util.inspect(args) + "\n");
  }
}

function buildMessage(level, msg, args, options) {
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

  _args = logCleaner.cleanArgs(_args);

  let serialized = serialize([], _args),
    tokens = {
    date: new Date().toISOString(),
    level: level,
    message: logCleaner.cleanUrlRawParameters(_msg),
    serverId: options && options.serverId ? `${options.serverId}#${process.pid}` : "",
    traceId: options && options.traceId ? options.traceId : "",
    data: serialized.length > 0 ?  serialized : ""
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

  _log(msg) {
    this.loggers.forEach((logger) => {
      logger.log(msg);
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
