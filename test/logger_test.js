const assert = require("node:assert/strict");
const {IncomingMessage} = require("node:http");
const {describe, it, beforeEach, afterEach} = require("node:test");
const sinon = require("sinon");
const {Logger} = require("../index");

describe("Logger", () => {
  let mockLogger;
  let logger;
  let clock;
  let currentDate = new Date();

  beforeEach(() => {
    mockLogger = {
      log: sinon.stub(),
      write: sinon.stub(),
      error: () => {}
    };

    logger = new Logger();
    logger.addLogger(mockLogger);

    // Add 1 millisecond to the current date to ensure that each test run uses a unique timestamp
    currentDate = new Date(currentDate.valueOf() + 1);
    clock = sinon.useFakeTimers(currentDate);
  });

  afterEach(() => {
    clock.restore();
    sinon.restore();
  });

  it("should allow a string message to be logged", () => {
    logger.info("Some message");
    sinon.assert.calledOnce(mockLogger.log);
    sinon.assert.calledWithMatch(mockLogger.log, {
      message: "Some message",
      data: undefined
    });
  });

  it("should allow an object to be logged", () => {
    logger.info({someProperty: "some value"});
    sinon.assert.calledOnce(mockLogger.log);
    sinon.assert.calledWithMatch(mockLogger.log, {
      message: "",
      data: { someProperty: "some value" }
    });
  });

  it("should allow the message argument and the data argument to be provided to the logger in any order", () => {
    logger.info("Some message", {someProperty: "some value"});
    sinon.assert.calledOnce(mockLogger.log);
    sinon.assert.calledWithMatch(mockLogger.log, {
      message: "Some message",
      data: { someProperty: "some value" }
    });

    sinon.reset();
    logger.info({someProperty: "some value"}, "Some message");
    sinon.assert.calledOnce(mockLogger.log);
    sinon.assert.calledWithMatch(mockLogger.log, {
      message: "Some message",
      data: { someProperty: "some value" }
    });
  });

  it("should remove sensitive keys from any objects provided to the logger", () => {
    logger.info({password: "some password"});
    sinon.assert.calledOnce(mockLogger.log);
    sinon.assert.calledWithMatch(mockLogger.log, {
      data: { password: '***' }
    });
  });

  it("should create a log entry with the correct severity", () => {
    logger.debug("Some message");
    sinon.assert.calledWithMatch(mockLogger.log, {level: "debug"});

    sinon.reset();
    logger.info("Some message");
    sinon.assert.calledWithMatch(mockLogger.log, {level: "info"});

    sinon.reset();
    logger.error("Some message");
    sinon.assert.calledWithMatch(mockLogger.log, {level: "error"});

    sinon.reset();
    logger.fatal("Some message");
    sinon.assert.calledWithMatch(mockLogger.log, {level: "fatal"});
  });

  it("should create a log entry with the current date in nanosecond precision", () => {
    logger.info("Some message");
    sinon.assert.calledWithMatch(mockLogger.log, {
      date: `${currentDate.toISOString().slice(0, -1)}000000Z`
    });
  });

  it("should ensure that every log entry has a unique date, particularly when the logger is rapidly called many times in a row", () => {
    // Unique timestamps are necessary so that logging infrastructure does not de-duplicate log entries.
    logger.info("Some message");
    logger.info("Some message");
    logger.info("Some message");

    assert.strictEqual(mockLogger.log.args[0][0].date, `${currentDate.toISOString().slice(0, -1)}000000Z`);
    assert.strictEqual(mockLogger.log.args[1][0].date, `${currentDate.toISOString().slice(0, -1)}000001Z`);
    assert.strictEqual(mockLogger.log.args[2][0].date, `${currentDate.toISOString().slice(0, -1)}000002Z`);
  });

  describe("data logging", () => {
    it("should correctly log a string", () => {
      logger.info("Some message", "some data");
      sinon.assert.calledWithMatch(mockLogger.log, {
        data: "some data"
      });
    });

    it("should correctly log a number ", () => {
      logger.info("Some message", -47682.36);
      sinon.assert.calledWithMatch(mockLogger.log, {
        data: -47682.36
      });
    });

    it("should correctly log the number 0", () => {
      logger.info("Some message", 0);
      sinon.assert.calledWithMatch(mockLogger.log, {
        data: 0
      });
    });

    it("should correctly log the value 'null'", () => {
      logger.info("Some message", null);
      sinon.assert.calledWithMatch(mockLogger.log, {
        data: null
      });
    });

    it("should correctly log the value 'undefined'", () => {
      logger.info("Some message", undefined);
      sinon.assert.calledWithMatch(mockLogger.log, {
        data: undefined
      });
    });

    it("should correctly log an error", () => {
      const error = new Error("Some message");
      logger.info("Some message", error);
      sinon.assert.calledWithMatch(mockLogger.log, {
        data: error
      });
    });

    it("should correctly log an object with deep properties", () => {
      logger.info("Some message", {
        someProperty: "some value",
        someChildObject: {
          someOtherProperty: "some other value"
        }
      });
      sinon.assert.calledWithMatch(mockLogger.log, {
        data: {
          someProperty: "some value",
          someChildObject: {
            someOtherProperty: "some other value"
          }
        }
      });
    });

    it("should correctly log an empty object", () => {
      logger.info("Some message", {});
      sinon.assert.calledWithMatch(mockLogger.log, {
        data: {}
      });
    });

    it("should correctly log an array of values", () => {
      logger.info("Some message", [
        "Some string",
        2237,
        {someProperty: "some value"}
      ]);
      sinon.assert.calledWithMatch(mockLogger.log, {
        data: [
          "Some string",
          2237,
          {someProperty: "some value"}
        ]
      });
    });

    it("should correctly log an empty array", () => {
      logger.info("Some message", []);
      sinon.assert.calledWithMatch(mockLogger.log, {
        data: []
      });
    });

    it("should correctly log 'NaN'", () => {
      logger.info("Some message", NaN);
      sinon.assert.calledWithMatch(mockLogger.log, {
        data: NaN
      });
    });

    it("should correctly log 'Infinity'", () => {
      logger.info("Some message", Infinity);
      sinon.assert.calledWithMatch(mockLogger.log, {
        data: Infinity
      });
    });

    it("should log a NodeJS 'IncomingMessage' by reporting its 'headers' and 'body'", () => {
      const incomingMessage = new IncomingMessage();
      incomingMessage.headers = {
        "content-type": "application/json"
      };
      incomingMessage.body = {
        someProperty: "some value"
      };

      logger.info("Some message", incomingMessage);
      sinon.assert.calledWithMatch(mockLogger.log, {
        data: {
          headers: {
            'content-type': 'application/json'
          },
          body: {
            someProperty: 'some value'
          }
        }
      });
    });

    it("should log a Set as an empty object", () => {
      // This behaviour should be changed in the future
      logger.info("Some message", new Set([1, 2, 3]));
      sinon.assert.calledWithMatch(mockLogger.log, {
        data: {}
      });
    });

    it( "should log a Map as an empty object", () => {
      // This behaviour should be changed in the future
      const map = new Map();
      map.set("someProperty", "some value");

      logger.info("Some message", map);
      sinon.assert.calledWithMatch(mockLogger.log, {
        data: {}
      });
    });
  });
});
