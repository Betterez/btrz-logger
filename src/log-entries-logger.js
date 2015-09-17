"use strict";

let logentries = require("node-logentries");

class LogEntriesLogger {

  constructor(options) {
    options.levels = {debug: 0, info: 1, error: 2, fatal: 3};
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
