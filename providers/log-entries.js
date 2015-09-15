"use strict";

let logentries = require("node-logentries");

exports.create = function (options) {
  let logger = logentries.logger(options.app),
    access = logentries.logger(options.access);
  return {
    error: function (tokens) {
      logger.log(tokens.level, tokens);
    },
    // Used for Uncaught Exceptions
    fatal: function (tokens) {
      this.error(tokens);
    },
    // Used for Express logger
    write: function (buf) {
      access.log("access", buf);
    }
  };
};
