const {IncomingMessage} = require("node:http");
const chai = require("chai");
const {expect} = require("chai");
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const {Logger} = require("../index");

chai.use(sinonChai);

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
    expect(mockLogger.log).to.have.been.calledOnce;
    expect(mockLogger.log).to.have.been.calledWithMatch({
      message: "Some message",
      data: undefined
    });
  });

  it("should allow an object to be logged", () => {
    logger.info({someProperty: "some value"});
    expect(mockLogger.log).to.have.been.calledOnce;
    expect(mockLogger.log).to.have.been.calledWithMatch({
      message: "",
      data: { someProperty: "some value" }
    });
  });

  it("should allow the message argument and the data argument to be provided to the logger in any order", () => {
    logger.info("Some message", {someProperty: "some value"});
    expect(mockLogger.log).to.have.been.calledOnce;
    expect(mockLogger.log).to.have.been.calledWithMatch({
      message: "Some message",
      data: { someProperty: "some value" }
    });

    sinon.reset();
    logger.info({someProperty: "some value"}, "Some message");
    expect(mockLogger.log).to.have.been.calledOnce;
    expect(mockLogger.log).to.have.been.calledWithMatch({
      message: "Some message",
      data: { someProperty: "some value" }
    });
  });

  it("should remove sensitive keys from any objects provided to the logger", () => {
    logger.info({password: "some password"});
    expect(mockLogger.log).to.have.been.calledOnce;
    expect(mockLogger.log).to.have.been.calledWithMatch({
      data: { password: '***' }
    });
  });

  it("should create a log entry with the correct severity", () => {
    logger.debug("Some message");
    expect(mockLogger.log).to.have.been.calledWithMatch({level: "debug"});

    sinon.reset();
    logger.info("Some message");
    expect(mockLogger.log).to.have.been.calledWithMatch({level: "info"});

    sinon.reset();
    logger.error("Some message");
    expect(mockLogger.log).to.have.been.calledWithMatch({level: "error"});

    sinon.reset();
    logger.fatal("Some message");
    expect(mockLogger.log).to.have.been.calledWithMatch({level: "fatal"});
  });

  it("should create a log entry with the current date in nanosecond precision", () => {
    logger.info("Some message");
    expect(mockLogger.log).to.have.been.calledWithMatch({
      date: `${currentDate.toISOString().slice(0, -1)}000000Z`
    });
  });

  it("should ensure that every log entry has a unique date, particularly when the logger is rapidly called many times in a row", () => {
    // Unique timestamps are necessary so that logging infrastructure does not de-duplicate log entries.
    logger.info("Some message");
    logger.info("Some message");
    logger.info("Some message");

    expect(mockLogger.log.args[0][0].date).to.eql(`${currentDate.toISOString().slice(0, -1)}000000Z`);
    expect(mockLogger.log.args[1][0].date).to.eql(`${currentDate.toISOString().slice(0, -1)}000001Z`);
    expect(mockLogger.log.args[2][0].date).to.eql(`${currentDate.toISOString().slice(0, -1)}000002Z`);
  });

  describe("data logging", () => {
    it("should correctly log a string", () => {
      logger.info("Some message", "some data");
      expect(mockLogger.log).to.have.been.calledWithMatch({
        data: "some data"
      });
    });

    it("should correctly log a number ", () => {
      logger.info("Some message", -47682.36);
      expect(mockLogger.log).to.have.been.calledWithMatch({
        data: -47682.36
      });
    });

    it("should correctly log the number 0", () => {
      logger.info("Some message", 0);
      expect(mockLogger.log).to.have.been.calledWithMatch({
        data: 0
      });
    });

    it("should correctly log the value 'null'", () => {
      logger.info("Some message", null);
      expect(mockLogger.log).to.have.been.calledWithMatch({
        data: null
      });
    });

    it("should correctly log the value 'undefined'", () => {
      logger.info("Some message", undefined);
      expect(mockLogger.log).to.have.been.calledWithMatch({
        data: undefined
      });
    });

    it("should correctly log an error", () => {
      const error = new Error("Some message");
      logger.info("Some message", error);
      expect(mockLogger.log).to.have.been.calledWithMatch({
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
      expect(mockLogger.log).to.have.been.calledWithMatch({
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
      expect(mockLogger.log).to.have.been.calledWithMatch({
        data: {}
      });
    });

    it("should correctly log an array of values", () => {
      logger.info("Some message", [
        "Some string",
        2237,
        {someProperty: "some value"}
      ]);
      expect(mockLogger.log).to.have.been.calledWithMatch({
        data: [
          "Some string",
          2237,
          {someProperty: "some value"}
        ]
      });
    });

    it("should correctly log an empty array", () => {
      logger.info("Some message", []);
      expect(mockLogger.log).to.have.been.calledWithMatch({
        data: []
      });
    });

    it("should correctly log 'NaN'", () => {
      logger.info("Some message", NaN);
      expect(mockLogger.log).to.have.been.calledWithMatch({
        data: NaN
      });
    });

    it("should correctly log 'Infinity'", () => {
      logger.info("Some message", Infinity);
      expect(mockLogger.log).to.have.been.calledWithMatch({
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
      expect(mockLogger.log).to.have.been.calledWithMatch({
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
      expect(mockLogger.log).to.have.been.calledWithMatch({
        data: {}
      });
    });

    it( "should log a Map as an empty object", () => {
      // This behaviour should be changed in the future
      const map = new Map();
      map.set("someProperty", "some value");

      logger.info("Some message", map);
      expect(mockLogger.log).to.have.been.calledWithMatch({
        data: {}
      });
    });
  });
});
