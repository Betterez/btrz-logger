const assert = require("assert");
const memoize = require("lodash.memoize");
const Logger = require("r7insight_node");
const logCleaner = require("./log-cleaner");
/*
var Logger = require('r7insight_node');
var log = new Logger({
  token: 'Your log token will display here',
  region: 'eu'
});
*/

// We memoize the function that creates connections to Logentries so that we only create one connection to Logentries for each unique
// api token
const cacheKeyResolver = (options) => {
  return options.token;
};
const createLogEntriesLogger = memoize((args) => {
  return new Logger({
    token: args.token,
    levels: args.levels,
    region: 'eu'
  })
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
