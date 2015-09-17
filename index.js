"use strict";

exports.create = function (options) {

  let _ = require("lodash"),
    util = require("util"),
    loggers = [],
    level,
    levels = {debug: 0, info: 1, error: 2, fatal: 3};

  function write(func, msg) {
    loggers.forEach(function doLog(logger) {
      logger[func].apply(logger, [msg]);
    });
  }

  function getDateParts() {
    let dateParts = new Date().toISOString().replace("Z", "").split("T");
    return {
      date: dateParts[0],
      time: dateParts[1]
    };
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

  function buildMessage(level, msg, args) {
    if (!Array.isArray(args)) {
      args = [args];
    }
    let serialized = serialize([], args),
      dateParts = getDateParts(),
      tokens = {
      date: dateParts.date,
      time: dateParts.time,
      level: level,
      message: msg,
      serverId: options && options.serverId ? options.serverId : "",
      data: serialized.length > 0 ?  serialized : ""
    };
    return tokens;
  }

  return {

    setLevel: function (minLevel) {
      level = minLevel;
    },

    getLevel: function () {
      if (!level) {
        level = options && options.level ? options.level : "debug";
      }
      return level;
    },

    getLoggers: function () {
      return loggers;
    },

    addLogger: function (logger) {
      if (logger.error && _.isFunction(logger.error)) {
        loggers.push(logger);
      } else {
        let loggerOptions = options.loggers[logger];
        loggers.push(require("./providers/" + loggerOptions.provider).create(loggerOptions.options));
      }
    },

    clearLoggers: function () {
      loggers = [];
    },

    // Level ? :-)
    log: function (level, msg, args) {
      if (levels[this.getLevel()] <= levels[level]) {
        write("error", buildMessage(level, msg, args));
      }
    },

    // Level 0
    debug: function (msg, args) {
      if (levels[this.getLevel()] <= 0) {
        write("error", buildMessage("debug", msg, args));
      }
    },

    // Level 1
    info: function (msg, args) {
      if (levels[this.getLevel()] <= 1) {
        write("error", buildMessage("info", msg, args));
      }
    },

    // Level 2
    error: function (msg, args) {
      if (levels[this.getLevel()] <= 2) {
        write("error", buildMessage("error", msg, args));
      }
    },

    // Level 3
    fatal: function (msg, args) {
      if (levels[this.getLevel()] <= 3) {
        write("error", buildMessage("fatal", msg, args));
      }
    }
  };
};
