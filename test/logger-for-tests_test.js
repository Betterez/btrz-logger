const assert = require("node:assert/strict");
const {describe, it, beforeEach, afterEach} = require("node:test");
const sinon = require("sinon");
const {LoggerForTests, Logger} = require("../index");

describe("LoggerForTests", () => {
  let loggerForTests;
  let mockLogDestination;

  beforeEach(() => {
    mockLogDestination = {
      log: sinon.stub(),
      write: sinon.stub(),
      error: sinon.stub()
    };
    loggerForTests = new LoggerForTests();
    loggerForTests.addLogger(mockLogDestination);

    LoggerForTests.onTestFinished({})
  });

  afterEach(() => {
    sinon.restore();
  });

  for (const logLevel of Object.values(Logger.LogLevel())) {
    it(`should correctly handle a ${logLevel} log`, () => {
      loggerForTests[logLevel]("Some message");
      LoggerForTests.flushBuffer();

      sinon.assert.calledOnce(mockLogDestination.log);
      const logTokens = mockLogDestination.log.firstCall.args[0];
      assert.deepStrictEqual({
        level: logLevel,
        message: "Some message"
      }, {
        level: logTokens.level,
        message: logTokens.message
      });
    });
  }

  it("should not output any logs until flushBuffer() is called", () => {
    loggerForTests.info("Some message");
    loggerForTests.error("Some other message");
    sinon.assert.notCalled(mockLogDestination.log);

    LoggerForTests.flushBuffer();
    sinon.assert.callCount(mockLogDestination.log, 2);
    assert.deepStrictEqual({
      level: "info",
      message: "Some message"
    }, {
      level: mockLogDestination.log.firstCall.args[0].level,
      message: mockLogDestination.log.firstCall.args[0].message
    });
    assert.deepStrictEqual({
      level: "error",
      message: "Some other message"
    }, {
      level: mockLogDestination.log.secondCall.args[0].level,
      message: mockLogDestination.log.secondCall.args[0].message
    });
  });

  it("should immediately output all buffered logs when a fatal log event occurs", () => {
    loggerForTests.info("Some info message");
    sinon.assert.notCalled(mockLogDestination.log);

    loggerForTests.fatal("Some fatal message");
    sinon.assert.callCount(mockLogDestination.log, 2);
    assert.deepStrictEqual({
      level: "info",
      message: "Some info message"
    }, {
      level: mockLogDestination.log.firstCall.args[0].level,
      message: mockLogDestination.log.firstCall.args[0].message
    });
    assert.deepStrictEqual({
      level: "fatal",
      message: "Some fatal message"
    }, {
      level: mockLogDestination.log.secondCall.args[0].level,
      message: mockLogDestination.log.secondCall.args[0].message
    });
  });

  it("should stop buffering logs once a fatal log event occurs, and output logs immediately", () => {
    loggerForTests.fatal("Some fatal message");
    sinon.assert.calledOnce(mockLogDestination.log);
    loggerForTests.info("Some info message");
    sinon.assert.callCount(mockLogDestination.log, 2);
  });

  it("should resume buffering logs when .onTestFinished() is called", () => {
    loggerForTests.fatal("Some fatal message");
    sinon.assert.calledOnce(mockLogDestination.log);
    mockLogDestination.log.reset();

    LoggerForTests.onTestFinished({});
    loggerForTests.info("Some info message");
    sinon.assert.notCalled(mockLogDestination.log);
  });

  it("should output all buffered logs when onTestFinished() is called, and the test has failed", () => {
    loggerForTests.info("Some info message");
    loggerForTests.debug("Some debug message");
    sinon.assert.notCalled(mockLogDestination.log);

    LoggerForTests.onTestFinished({state: "failed"});
    sinon.assert.callCount(mockLogDestination.log, 2);
  });

  it("should not output any logs when onTestFinished() is called, and the test has succeeded", () => {
    loggerForTests.info("Some info message");
    loggerForTests.debug("Some debug message");
    LoggerForTests.onTestFinished({state: "passed"});
    sinon.assert.notCalled(mockLogDestination.log);
  });

  it("should clear the log buffer when onTestFinished() is called, and the test has succeeded", () => {
    loggerForTests.info("Some info message");
    loggerForTests.debug("Some debug message");
    LoggerForTests.onTestFinished({state: "passed"});
    sinon.assert.notCalled(mockLogDestination.log);

    LoggerForTests.flushBuffer();
    sinon.assert.notCalled(mockLogDestination.log);
  });

  it("should output the buffered logs from all instances of the logger in the correct order when onTestFinished() is called, and the test has failed", () => {
    const loggerOne = new LoggerForTests();
    const loggerTwo = new LoggerForTests();

    loggerOne.addLogger(mockLogDestination);
    loggerTwo.addLogger(mockLogDestination);

    loggerOne.info("Message A");
    loggerTwo.info("Message B");
    loggerTwo.info("Message C");
    loggerOne.info("Message D");
    loggerTwo.info("Message E");

    LoggerForTests.onTestFinished({state: "failed"});

    sinon.assert.callCount(mockLogDestination.log, 5);
    const logMessagesInOrder = mockLogDestination.log.args.map((arguments) => arguments[0].message);
    assert.deepStrictEqual(logMessagesInOrder, [
      "Message A",
      "Message B",
      "Message C",
      "Message D",
      "Message E"
    ]);
  });

  it("should clear the buffer from all instances of the logger when onTestFinished() is called", () => {
    const loggerOne = new LoggerForTests();
    const loggerTwo = new LoggerForTests();

    loggerOne.addLogger(mockLogDestination);
    loggerTwo.addLogger(mockLogDestination);

    loggerOne.info("Message A");
    loggerTwo.info("Message B");

    LoggerForTests.onTestFinished({state: "passed"});
    sinon.assert.callCount(mockLogDestination.log, 0);

    // Check that the buffer was cleared by trying to flush all buffered logs
    LoggerForTests.flushBuffer();
    sinon.assert.callCount(mockLogDestination.log, 0);
  });
});
