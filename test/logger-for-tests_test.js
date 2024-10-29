const chai = require("chai");
const {expect} = chai;
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const {LoggerForTests, Logger} = require("../index");

chai.use(sinonChai);

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

      expect(mockLogDestination.log).to.have.been.calledOnce;
      const logTokens = mockLogDestination.log.firstCall.args[0];
      expect(logTokens).to.deep.contain({
        level: logLevel,
        message: "Some message"
      });
    });
  }

  it("should not output any logs until flushBuffer() is called", () => {
    loggerForTests.info("Some message");
    loggerForTests.error("Some other message");
    expect(mockLogDestination.log).not.to.have.been.called;

    LoggerForTests.flushBuffer();
    expect(mockLogDestination.log).to.have.been.calledTwice;
    expect(mockLogDestination.log.firstCall.args[0]).to.deep.contain({
      level: "info",
      message: "Some message"
    });
    expect(mockLogDestination.log.secondCall.args[0]).to.deep.contain({
      level: "error",
      message: "Some other message"
    });
  });

  it("should immediately output all buffered logs when a fatal log event occurs", () => {
    loggerForTests.info("Some info message");
    expect(mockLogDestination.log).not.to.have.been.called;

    loggerForTests.fatal("Some fatal message");
    expect(mockLogDestination.log).to.have.been.calledTwice;
    expect(mockLogDestination.log.firstCall.args[0]).to.deep.contain({
      level: "info",
      message: "Some info message"
    });
    expect(mockLogDestination.log.secondCall.args[0]).to.deep.contain({
      level: "fatal",
      message: "Some fatal message"
    });
  });

  it("should stop buffering logs once a fatal log event occurs, and output logs immediately", () => {
    loggerForTests.fatal("Some fatal message");
    expect(mockLogDestination.log).to.have.been.calledOnce;
    loggerForTests.info("Some info message");
    expect(mockLogDestination.log).to.have.been.calledTwice;
  });

  it("should resume buffering logs when .onTestFinished() is called", () => {
    loggerForTests.fatal("Some fatal message");
    expect(mockLogDestination.log).to.have.been.calledOnce;
    mockLogDestination.log.reset();

    LoggerForTests.onTestFinished({});
    loggerForTests.info("Some info message");
    expect(mockLogDestination.log).not.to.have.been.called;
  });

  it("should output all buffered logs when onTestFinished() is called, and the test has failed", () => {
    loggerForTests.info("Some info message");
    loggerForTests.debug("Some debug message");
    expect(mockLogDestination.log).not.to.have.been.called;

    LoggerForTests.onTestFinished({state: "failed"});
    expect(mockLogDestination.log).to.have.been.calledTwice;
  });

  it("should not output any logs when onTestFinished() is called, and the test has succeeded", () => {
    loggerForTests.info("Some info message");
    loggerForTests.debug("Some debug message");
    LoggerForTests.onTestFinished({state: "passed"});
    expect(mockLogDestination.log).not.to.have.been.called;
  });

  it("should clear the log buffer when onTestFinished() is called, and the test has succeeded", () => {
    loggerForTests.info("Some info message");
    loggerForTests.debug("Some debug message");
    LoggerForTests.onTestFinished({state: "passed"});
    expect(mockLogDestination.log).not.to.have.been.called;

    LoggerForTests.flushBuffer();
    expect(mockLogDestination.log).not.to.have.been.called;
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

    expect(mockLogDestination.log).to.have.callCount(5);
    const logMessagesInOrder = mockLogDestination.log.args.map((arguments) => arguments[0].message);
    expect(logMessagesInOrder).to.eql([
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
    expect(mockLogDestination.log).to.have.callCount(0);

    // Check that the buffer was cleared by trying to flush all buffered logs
    LoggerForTests.flushBuffer();
    expect(mockLogDestination.log).to.have.callCount(0);
  });
});
