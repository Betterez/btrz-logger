const {expect} = require("chai");
const Chance = require("chance");
const chance = new Chance();
const sinon = require("sinon");
const sandbox = sinon.createSandbox();
const {ALL_OUTPUT_DESTINATIONS, CONSOLE_OUTPUT, LOGENTRIES_OUTPUT, SILENT_OUTPUT} = require("../constants");
const {ConsoleLogger} = require("../src/console-logger");
const {LogEntriesLogger} = require("../src/log-entries-logger");
const {SilentLogger} = require("../src/silent-logger");
const {LoggerFactory} = require("../src/logger-factory");


describe("LoggerFactory", () => {
  let serverId = null;
  let traceId = null;
  let logEntriesToken = null;
  let outputDestinations = null;

  beforeEach(() => {
    serverId = chance.hash();
    traceId = chance.hash();
    logEntriesToken = chance.hash();
    outputDestinations = ALL_OUTPUT_DESTINATIONS;
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("constructor", () => {
    it("should set the value of instance variables appropriately", () => {
      const loggerFactory = new LoggerFactory({
        serverId,
        logEntriesToken,
        outputDestinations
      });

      expect(loggerFactory.serverId).to.eql(serverId);
      expect(loggerFactory.logEntriesToken).to.eql(logEntriesToken);
      expect(loggerFactory.outputDestinations).to.deep.eql(outputDestinations);
    })
  });

  describe(".create()", () => {
    let loggerFactory = null;

    beforeEach(() => {
      loggerFactory = new LoggerFactory({serverId, logEntriesToken, outputDestinations});
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
      expect(logger.options).to.deep.eql({serverId, traceId});
    });

    it("should allow options to be omitted", () => {
      // We just expect this test to to not throw an error
      const logger = loggerFactory.create();
    });
  });
});