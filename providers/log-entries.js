"use strict";

let logentries = require("node-logentries");

exports.create = function (options) {
  let logger = logentries.logger(options);
  return {
    error: function (tokens) {
      let level = tokens.level;
      delete tokens.level;
      logger.log(level, tokens);
    },

    // Used for Uncaught Exceptions
    fatal: function (tokens) {
      this.error(tokens);
    },

    // Used for Express logger
    write: function (buf) {
      logger.log("access", buf);
    }
  };
};
