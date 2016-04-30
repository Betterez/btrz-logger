"use strict";

let logentries = require("node-logentries");

class LogEntriesLogger {

  constructor(options) {
    options.levels = {access: 0, debug: 1, info: 2, error: 3, fatal: 4};
    this.logger = logentries.logger(options);
  }

  error(tokens) {
    let level = tokens.level;
    delete tokens.level;
    this.logger.log(level, tokens);
  }

  // Used for Uncaught Exceptions
  fatal(tokens) {
    this.logger.log("error", tokens);
  }

  // Used for Express logger
  write(buf) {
    this.logger.log("access", buf);
  }
}

exports.LogEntriesLogger = LogEntriesLogger;
