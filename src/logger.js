"use strict";
const logCleaner = require("./log-cleaner");
let util = require("util");

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

  let serialized = serialize([], _args),
    tokens = {
    date: new Date().toISOString(),
    level: level,
    message: logCleaner.cleanUrlRawParameters(_msg),
    serverId: options && options.serverId ? options.serverId : "",
      traceId: options && options.traceId ? options.traceId : "",
    data: serialized.length > 0 ?  serialized : ""
  };
  return tokens;
}

class Logger {
  constructor(options) {
    this.options = options;
    this.loggers = [];
    this.level = options && options.level ? options.level : "debug";
    this.levels = {debug: 0, info: 1, error: 2, fatal: 3};
  }

  _write(func, msg) {
    this.loggers.forEach(function doLog(logger) {
      logger[func].apply(logger, [msg]);
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
      this._write("error", buildMessage(level, msg, args, this.options));
    }
  }

  // Level 0
  debug(msg, args) {
    if (this.levels[this.getLevel()] <= 0) {
      this._write("error", buildMessage("debug", msg, args, this.options));
    }
  }

  // Level 1
  info(msg, args) {
    if (this.levels[this.getLevel()] <= 1) {
      this._write("error", buildMessage("info", msg, args, this.options));
    }
  }

  // Level 2
  error(msg, args) {
    if (this.levels[this.getLevel()] <= 2) {
      this._write("error", buildMessage("error", msg, args, this.options));
    }
  }

  // Level 3
  fatal(msg, args) {
    if (this.levels[this.getLevel()] <= 3) {
      this._write("error", buildMessage("fatal", msg, args, this.options));
    }
  }
}

exports.Logger = Logger;
