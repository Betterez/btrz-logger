const assert = require("assert");
const {Logger} = require("../src/logger");
const {ConsoleLogger} = require("../src/console-logger");
const {LogEntriesLogger} = require("../src/log-entries-logger");
const {SilentLogger} = require("../src/silent-logger");
const {CONSOLE_OUTPUT, LOGENTRIES_OUTPUT, SILENT_OUTPUT} = require("../constants");


class LoggerFactory {

  constructor(options) {
    const {serverId, logEntriesToken, outputDestinations} = options;

    this.serverId = serverId;
    this.logEntriesToken = logEntriesToken;
    this.outputDestinations = outputDestinations;
  }

  create(options = {}) {
    const {outputDestinations, traceId} = options;
    const _outputDestinations = outputDestinations || this.outputDestinations;

    assert(Array.isArray(_outputDestinations) && _outputDestinations.length > 0, "an array of one or more outputDestinations is required");

    const logger = new Logger({
      serverId: this.serverId,
      traceId
    });

    for (const destination of _outputDestinations) {
      switch (destination) {
        case CONSOLE_OUTPUT:
          logger.addLogger(new ConsoleLogger());
          break;
        case LOGENTRIES_OUTPUT:
          logger.addLogger(new LogEntriesLogger({token: this.logEntriesToken}));
          break;
        case SILENT_OUTPUT:
          logger.addLogger(new SilentLogger());
          break;
        default:
          throw new Error(`Invalid output destination: ${destination}`);
      }
    }

    return logger;
  }
}


module.exports = {LoggerFactory};
