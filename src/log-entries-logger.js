"use strict";

const assert = require("assert");
const _ = require("lodash");
const logentries = require("node-logentries");
const logCleaner = require("./log-cleaner");

// We memoize the function that creates connections to Logentries so that we only create one connection to Logentries for each unique
// api token
const cacheKeyResolver = (options) => {
  return options.token;
};
const createLogEntriesLogger = _.memoize((...args) => {
  return logentries.logger(...args);
}, cacheKeyResolver);


function stringifyTokens(tokens) {
  return {
    date: `"${tokens.date}"`,
    message: `"${tokens.message}"`,
    serverId: `"${tokens.serverId}"`,
    traceId: `"${tokens.traceId}"`,
    data: tokens.data
  };
}


class LogEntriesLogger {

  constructor(options) {
    assert(options.token, "a token is required to connect to logentries");
    options.levels = {access: 0, debug: 1, info: 2, error: 3, fatal: 4};
    this.logger = createLogEntriesLogger(options);
  }

  log(tokens) {
    let level = tokens.level;
    delete tokens.level;
    this.logger.log(level, stringifyTokens(tokens));
  }

  // Used for Uncaught Exceptions
  fatal(tokens) {
    this.logger.log("error", stringifyTokens(tokens));
  }

  // Used for Express logger
  write(buf) {
    let cleanBuf = logCleaner.cleanUrlRawParameters(buf);
    this.logger.log("access", cleanBuf);
  }
}

// For backwards compatibility
LogEntriesLogger.prototype.error = LogEntriesLogger.prototype.log;

exports.LogEntriesLogger = LogEntriesLogger;
