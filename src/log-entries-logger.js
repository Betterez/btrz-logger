"use strict";

let logentries = require("node-logentries");

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
    options.levels = {access: 0, debug: 1, info: 2, error: 3, fatal: 4};
    this.logger = logentries.logger(options);
  }

  error(tokens) {
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
    this.logger.log("access", buf);
  }
}

exports.LogEntriesLogger = LogEntriesLogger;
