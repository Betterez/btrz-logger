"use strict";

exports.create = function (options) {

  let _ = require("lodash"),
    loggers = [console],
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
    if (!args) { return results; }
    if (Array.isArray(args)) {
      args.forEach(function (a) {
        serialize(results, a);
      });
      return results;
    }
    if (args.stack) {
      if (args.errorCode) {
        results.push(
          JSON.stringify({
            errorCode: args.errorCode,
            message: args.message,
            arguments: args.arguments,
            type: args.type
          }) +
          "\n" + JSON.stringify(args.data) +
          "\n" + args.stack + "\n"
        );
      } else {
        results.push(
          JSON.stringify({
            message: args.message,
            arguments: args.arguments,
            type: args.type
          }) +
          args.stack + "\n"
        );
      }
    } else {
      results.push(JSON.stringify(args) + "\n");
    }
  }

  function buildMessage(level, msg, args) {
    let serialized = serialize([], args),
      dateParts = getDateParts(),
      tokens = {
      date: dateParts.date,
      time: dateParts.time,
      level: level,
      message: msg,
      serverId: options.serverId,
      data: serialized
    };
    return tokens;
  }

  return {

    setLevel: function (minLevel) {
      level = minLevel;
    },

    getLevel: function () {
      if (!level) {
        level = options.level;
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
