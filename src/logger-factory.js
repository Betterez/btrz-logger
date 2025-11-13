const assert = require("assert");
const {Logger} = require("../src/logger");
const {LoggerForTests} = require("../src/logger-for-tests");
const {ConsoleLogger} = require("../src/console-logger");
const {LogEntriesLogger} = require("../src/log-entries-logger");
const {RotatingFileLogger} = require("../src/rotating-file-logger");
const {SilentLogger} = require("../src/silent-logger");
const {CONSOLE_OUTPUT, LOGENTRIES_OUTPUT, ROTATING_FILE_OUTPUT, SILENT_OUTPUT} = require("../constants");

class LoggerFactory {
  constructor(options) {
    const {
      serverId,
      logEntriesToken,
      outputDestinations,
      level,
      logName,
      logDirectory,
      sanitize,
      addNewlines,
      colorize,
      isRunningTests
    } = options;

    this.serverId = serverId;
    this.logEntriesToken = logEntriesToken;
    this.outputDestinations = outputDestinations;
    this.level = level;
    this.logName = logName;
    this.logDirectory = logDirectory;
    this.sanitize = sanitize;
    this.addNewlines = addNewlines;
    this.colorize = colorize;
    this.isRunningTests = isRunningTests;
  }

  create(options = {}) {
    const {outputDestinations, traceId, level, logName, logDirectory, sanitize, addNewlines, colorize} = options;

    const _outputDestinations = outputDestinations ?? this.outputDestinations;
    const _level = level ?? this.level;
    const _logName = logName ?? this.logName;
    const _logDirectory = logDirectory ?? this.logDirectory;
    const _sanitize = sanitize ?? this.sanitize;
    const _addNewlines = addNewlines ?? this.addNewlines;
    const _colorize = colorize ?? this.colorize;

    assert(Array.isArray(_outputDestinations) && _outputDestinations.length > 0, "an array of one or more outputDestinations is required");

    if (_outputDestinations.includes(ROTATING_FILE_OUTPUT)) {
      assert(_logName, "the 'logName' option is required when logging to a file");
      assert(_logDirectory, "the 'logDirectory' option is required when logging to a file");
      assert(typeof _sanitize === "boolean", "the 'sanitize' option is required when logging to a file");
    }

    let logger;
    if (this.isRunningTests) {
      logger = new LoggerForTests({
        serverId: this.serverId,
        traceId,
        level: _level
      });
    } else {
      logger = new Logger({
        serverId: this.serverId,
        traceId,
        level: _level
      });
    }

    for (const destination of _outputDestinations) {
      switch (destination) {
        case CONSOLE_OUTPUT:
          logger.addLogger(new ConsoleLogger({colorize: _colorize}));
          break;
        case LOGENTRIES_OUTPUT:
          logger.addLogger(new LogEntriesLogger({token: this.logEntriesToken}));
          break;
        case ROTATING_FILE_OUTPUT:
          logger.addLogger(new RotatingFileLogger({
            logName: _logName,
            logDirectory: _logDirectory,
            sanitize: _sanitize,
            addNewlines: _addNewlines,
            colorize: _colorize
          }));
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
