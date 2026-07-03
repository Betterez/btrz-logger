const assert = require("node:assert/strict");
const {IncomingMessage} = require("node:http");
const {describe, it, beforeEach, afterEach, mock} = require("node:test");
const {Logger} = require("../index");

describe("Logger", () => {
  let mockLogger;
  let logger;
  let clock;
  let currentDate = new Date();
  const assertLogEntryIncludes = (expectedEntry) => {
    assert.strictEqual(mockLogger.log.mock.callCount() > 0, true);
    const logEntry = mockLogger.log.mock.calls[0].arguments[0];
    for (const [key, value] of Object.entries(expectedEntry)) {
      assert.deepStrictEqual(logEntry[key], value);
    }
  };

  beforeEach(() => {
    mockLogger = {
      log: mock.fn(),
      write: mock.fn(),
      error: () => {}
    };

    logger = new Logger();
    logger.addLogger(mockLogger);

    // Add 1 millisecond to the current date to ensure that each test run uses a unique timestamp
    currentDate = new Date(currentDate.valueOf() + 1);
    clock = mock.timers;
    clock.enable({apis: ["Date"], now: currentDate});
  });

  afterEach(() => {
    clock.reset();
    mock.restoreAll();
  });

  it("should allow a string message to be logged", () => {
    logger.info("Some message");
    assert.strictEqual(mockLogger.log.mock.callCount(), 1);
    assertLogEntryIncludes({
      message: "Some message",
      data: undefined
    });
  });

  it("should allow an object to be logged", () => {
    logger.info({someProperty: "some value"});
    assert.strictEqual(mockLogger.log.mock.callCount(), 1);
    assertLogEntryIncludes({
      message: "",
      data: { someProperty: "some value" }
    });
  });

  it("should allow the message argument and the data argument to be provided to the logger in any order", () => {
    logger.info("Some message", {someProperty: "some value"});
    assert.strictEqual(mockLogger.log.mock.callCount(), 1);
    assertLogEntryIncludes({
      message: "Some message",
      data: { someProperty: "some value" }
    });

    mockLogger.log.mock.resetCalls();
    logger.info({someProperty: "some value"}, "Some message");
    assert.strictEqual(mockLogger.log.mock.callCount(), 1);
    assertLogEntryIncludes({
      message: "Some message",
      data: { someProperty: "some value" }
    });
  });

  it("should remove sensitive keys from any objects provided to the logger", () => {
    logger.info({password: "some password"});
    assert.strictEqual(mockLogger.log.mock.callCount(), 1);
    assertLogEntryIncludes({
      data: { password: '***' }
    });
  });

  it("should create a log entry with the correct severity", () => {
    logger.debug("Some message");
    assertLogEntryIncludes({level: "debug"});

    mockLogger.log.mock.resetCalls();
    logger.info("Some message");
    assertLogEntryIncludes({level: "info"});

    mockLogger.log.mock.resetCalls();
    logger.error("Some message");
    assertLogEntryIncludes({level: "error"});

    mockLogger.log.mock.resetCalls();
    logger.fatal("Some message");
    assertLogEntryIncludes({level: "fatal"});
  });

  it("should create a log entry with the current date in nanosecond precision", () => {
    logger.info("Some message");
    assertLogEntryIncludes({
      date: `${currentDate.toISOString().slice(0, -1)}000000Z`
    });
  });

  it("should ensure that every log entry has a unique date, particularly when the logger is rapidly called many times in a row", () => {
    // Unique timestamps are necessary so that logging infrastructure does not de-duplicate log entries.
    logger.info("Some message");
    logger.info("Some message");
    logger.info("Some message");

    assert.strictEqual(mockLogger.log.mock.calls[0].arguments[0].date, `${currentDate.toISOString().slice(0, -1)}000000Z`);
    assert.strictEqual(mockLogger.log.mock.calls[1].arguments[0].date, `${currentDate.toISOString().slice(0, -1)}000001Z`);
    assert.strictEqual(mockLogger.log.mock.calls[2].arguments[0].date, `${currentDate.toISOString().slice(0, -1)}000002Z`);
  });

  describe("data logging", () => {
    it("should correctly log a string", () => {
      logger.info("Some message", "some data");
      assertLogEntryIncludes({
        data: "some data"
      });
    });

    it("should correctly log a number ", () => {
      logger.info("Some message", -47682.36);
      assertLogEntryIncludes({
        data: -47682.36
      });
    });

    it("should correctly log the number 0", () => {
      logger.info("Some message", 0);
      assertLogEntryIncludes({
        data: 0
      });
    });

    it("should correctly log the value 'null'", () => {
      logger.info("Some message", null);
      assertLogEntryIncludes({
        data: null
      });
    });

    it("should correctly log the value 'undefined'", () => {
      logger.info("Some message", undefined);
      assertLogEntryIncludes({
        data: undefined
      });
    });

    it("should correctly log an error", () => {
      const error = new Error("Some message");
      logger.info("Some message", error);
      assertLogEntryIncludes({
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
      assertLogEntryIncludes({
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
      assertLogEntryIncludes({
        data: {}
      });
    });

    it("should correctly log an array of values", () => {
      logger.info("Some message", [
        "Some string",
        2237,
        {someProperty: "some value"}
      ]);
      assertLogEntryIncludes({
        data: [
          "Some string",
          2237,
          {someProperty: "some value"}
        ]
      });
    });

    it("should correctly log an empty array", () => {
      logger.info("Some message", []);
      assertLogEntryIncludes({
        data: []
      });
    });

    it("should correctly log 'NaN'", () => {
      logger.info("Some message", NaN);
      assertLogEntryIncludes({
        data: NaN
      });
    });

    it("should correctly log 'Infinity'", () => {
      logger.info("Some message", Infinity);
      assertLogEntryIncludes({
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
      assertLogEntryIncludes({
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
      assert.strictEqual(mockLogger.log.mock.callCount(), 1);
      assert.strictEqual(mockLogger.log.mock.calls[0].arguments[0].data instanceof Set, true);
    });

    it( "should log a Map as an empty object", () => {
      // This behaviour should be changed in the future
      const map = new Map();
      map.set("someProperty", "some value");

      logger.info("Some message", map);
      assert.strictEqual(mockLogger.log.mock.callCount(), 1);
      assert.strictEqual(mockLogger.log.mock.calls[0].arguments[0].data instanceof Map, true);
    });
  });
});
