describe("LoggerFactory", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const {expect} = require("chai");
  const Chance = require("chance");
  const chance = new Chance();
  const {
    ALL_OUTPUT_DESTINATIONS, CONSOLE_OUTPUT, LOGENTRIES_OUTPUT, ROTATING_FILE_OUTPUT, SILENT_OUTPUT,
    LOG_LEVEL_DEBUG, LOG_LEVEL_INFO, LOG_LEVEL_NOTICE, LOG_LEVEL_WARNING, LOG_LEVEL_ERROR, LOG_LEVEL_CRITICAL,
    LOG_LEVEL_ALERT, LOG_LEVEL_EMERGENCY
  } = require("../constants");
  const {ConsoleLogger} = require("../src/console-logger");
  const {LogEntriesLogger} = require("../src/log-entries-logger");
  const {RotatingFileLogger} = require("../src/rotating-file-logger");
  const {SilentLogger} = require("../src/silent-logger");
  const {Logger} = require("../src/logger");
  const {LoggerForTests} = require("../src/logger-for-tests");
  const {LoggerFactory} = require("../src/logger-factory");

  const logDirectory = path.join(__dirname, `../logs-${chance.hash()}`);

  let serverId = null;
  let traceId = null;
  let logEntriesToken = null;
  let logName = null;
  let sanitize = null;
  let addNewlines = null;
  let colorize = null;
  let outputDestinations = null;

  before(() => {
    fs.rmSync(logDirectory, {recursive: true, force: true});
  });

  beforeEach(() => {
    serverId = chance.hash();
    traceId = chance.hash();
    logEntriesToken = chance.guid();
    logName = `logs-${chance.word()}`;
    sanitize = chance.bool();
    addNewlines = chance.bool();
    colorize = chance.bool();
    outputDestinations = ALL_OUTPUT_DESTINATIONS;
  });

  after(() => {
    fs.rmSync(logDirectory, {recursive: true, force: true});
  });

  describe("constructor", () => {
    it("should set the value of instance variables appropriately", () => {
      const loggerFactory = new LoggerFactory({
        serverId,
        logEntriesToken,
        outputDestinations,
        logName,
        logDirectory,
        sanitize,
        addNewlines,
        colorize
      });

      expect(loggerFactory.serverId).to.eql(serverId);
      expect(loggerFactory.logEntriesToken).to.eql(logEntriesToken);
      expect(loggerFactory.outputDestinations).to.deep.eql(outputDestinations);
      expect(loggerFactory.logName).to.deep.eql(logName);
      expect(loggerFactory.logDirectory).to.deep.eql(logDirectory);
      expect(loggerFactory.sanitize).to.deep.eql(sanitize);
      expect(loggerFactory.addNewlines).to.deep.eql(addNewlines);
      expect(loggerFactory.colorize).to.deep.eql(colorize);
    });
  });

  describe(".create()", () => {
    let loggerFactory = null;
    let level = null;

    beforeEach(() => {
      level = chance.pickone([LOG_LEVEL_DEBUG, LOG_LEVEL_INFO, LOG_LEVEL_NOTICE, LOG_LEVEL_WARNING, LOG_LEVEL_ERROR,
        LOG_LEVEL_CRITICAL, LOG_LEVEL_ALERT, LOG_LEVEL_EMERGENCY]);
      loggerFactory = new LoggerFactory({serverId, logEntriesToken, outputDestinations, level, logName, logDirectory, sanitize, addNewlines, colorize});
    });


    function expectLoggerLogsToAllOutputDestinations(logger, _outputDestinations) {
      expect(_outputDestinations.length).to.be.gt(0);

      for (let i = 0; i < logger.loggers.length; i++) {
        const outputAdapter = logger.loggers[i];
        const requestedDestination = _outputDestinations[i];

        switch (requestedDestination) {
          case CONSOLE_OUTPUT:
            expect(outputAdapter).to.be.an.instanceOf(ConsoleLogger);
            break;
          case LOGENTRIES_OUTPUT:
            expect(outputAdapter).to.be.an.instanceOf(LogEntriesLogger);
            break;
          case ROTATING_FILE_OUTPUT:
            expect(outputAdapter).to.be.an.instanceOf(RotatingFileLogger);
            break;
          case SILENT_OUTPUT:
            expect(outputAdapter).to.be.an.instanceOf(SilentLogger);
            break;
          default:
            throw new Error("Test failed - invalid destination");
        }
      }
    }


    it("should throw an error if no output destinations are specified", () => {
      function sut() {
        return loggerFactory.create({outputDestinations: [], traceId});
      }

      expect(sut).to.throw("an array of one or more outputDestinations is required");
    });

    it("should throw an error if an invalid output destination is specified", () => {
      let outputDestinations = [chance.word()];

      function sut() {
        return loggerFactory.create({outputDestinations, traceId});
      }

      expect(sut).to.throw(`Invalid output destination: ${outputDestinations[0]}`);
    });

    it("should return a Logger instance that logs to all of the specified output destinations", () => {
      outputDestinations = ALL_OUTPUT_DESTINATIONS;
      let logger = loggerFactory.create({outputDestinations, traceId});
      expectLoggerLogsToAllOutputDestinations(logger, outputDestinations);

      outputDestinations = [chance.pickone(ALL_OUTPUT_DESTINATIONS)];
      logger = loggerFactory.create({outputDestinations, traceId});
      expectLoggerLogsToAllOutputDestinations(logger, outputDestinations);
    });

    it("should default to using the output destinations that were provided to the class constructor", () => {
      const logger = loggerFactory.create({traceId});
      expectLoggerLogsToAllOutputDestinations(logger, outputDestinations);
    });

    it("should return a Logger instance that has the correct 'serverId' and 'traceId'", () => {
      const logger = loggerFactory.create({traceId});
      expect(logger.options).to.deep.contain({serverId, traceId});
    });

    it("should return a Logger instance that has the specified minimum log level", () => {
      level = chance.pickone([LOG_LEVEL_DEBUG, LOG_LEVEL_INFO, LOG_LEVEL_NOTICE, LOG_LEVEL_WARNING, LOG_LEVEL_ERROR,
        LOG_LEVEL_CRITICAL, LOG_LEVEL_ALERT, LOG_LEVEL_EMERGENCY]);
      const logger = loggerFactory.create({level});
      expect(logger.level).to.eql(level);
    });

    it("should default to using the log level that was provided to the class constructor", () => {
      const logger = loggerFactory.create({});
      expect(logger.level).to.eql(level);
    });

    it("should return an instance of the 'Logger' class", () => {
      loggerFactory = new LoggerFactory({outputDestinations: [CONSOLE_OUTPUT]});
      const logger = loggerFactory.create({});
      expect(logger).to.be.an.instanceOf(Logger);
      expect(logger.constructor.name).to.eql("Logger");
    });

    it("should return an instance of 'LoggerForTests' when the 'isRunningTests' option is true", () => {
      loggerFactory = new LoggerFactory({isRunningTests: true, outputDestinations: [CONSOLE_OUTPUT]});
      const logger = loggerFactory.create({});
      expect(logger).to.be.an.instanceOf(LoggerForTests);
      expect(logger.constructor.name).to.eql("LoggerForTests");
    });

    it("should throw an error if one of the output destinations is a rotating file, and no 'logName' was provided", () => {
      loggerFactory = new LoggerFactory({isRunningTests: true, outputDestinations: [CONSOLE_OUTPUT, ROTATING_FILE_OUTPUT]});
      expect(() => loggerFactory.create({logDirectory, sanitize})).to.throw("the 'logName' option is required when logging to a file");
    });

    it("should throw an error if one of the output destinations is a rotating file, and no 'logDirectory' was provided", () => {
      loggerFactory = new LoggerFactory({isRunningTests: true, outputDestinations: [CONSOLE_OUTPUT, ROTATING_FILE_OUTPUT]});
      expect(() => loggerFactory.create({logName, sanitize})).to.throw("the 'logDirectory' option is required when logging to a file");
    });

    it("should throw an error if one of the output destinations is a rotating file, and no 'sanitize' option was provided", () => {
      loggerFactory = new LoggerFactory({isRunningTests: true, outputDestinations: [CONSOLE_OUTPUT, ROTATING_FILE_OUTPUT]});
      expect(() => loggerFactory.create({logName, logDirectory})).to.throw("the 'sanitize' option is required when logging to a file");
    });

    it("should allow options to be omitted", () => {
      // We just expect this test to to not throw an error
      const logger = loggerFactory.create();
    });
  });
});
