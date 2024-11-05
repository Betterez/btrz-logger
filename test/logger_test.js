const util = require("node:util");
const {IncomingMessage} = require("node:http");
const chai = require("chai");
const {expect} = require("chai");
const Chance = require("chance");
const chance = new Chance();
const sinon = require("sinon");
const sinonChai = require("sinon-chai");
const {Logger} = require("../index");

chai.use(sinonChai);

describe("Logger", () => {
  let mockLogger;
  let logger;
  let clock;
  let currentDate;

  beforeEach(() => {
    mockLogger = {
      log: sinon.stub(),
      write: sinon.stub(),
      error: () => {}
    };

    logger = new Logger();
    logger.addLogger(mockLogger);

    currentDate = new Date();
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
      message: "Some message"
    });
  });

  it("should allow an object to be logged", () => {
    logger.info({someProperty: "some value"});
    expect(mockLogger.log).to.have.been.calledOnce;
    expect(mockLogger.log).to.have.been.calledWithMatch({
      message: "",
      data: "{ someProperty: 'some value' }"
    });
  });

  it("should allow the message argument and the data argument to be provided to the logger in any order", () => {
    logger.info("Some message", {someProperty: "some value"});
    expect(mockLogger.log).to.have.been.calledOnce;
    expect(mockLogger.log).to.have.been.calledWithMatch({
      message: "Some message",
      data: "{ someProperty: 'some value' }"
    });

    sinon.reset();
    logger.info({someProperty: "some value"}, "Some message");
    expect(mockLogger.log).to.have.been.calledOnce;
    expect(mockLogger.log).to.have.been.calledWithMatch({
      message: "Some message",
      data: "{ someProperty: 'some value' }"
    });
  });

  it("should remove sensitive keys from any objects provided to the logger", () => {
    logger.info({password: "some password"});
    expect(mockLogger.log).to.have.been.calledOnce;
    expect(mockLogger.log).to.have.been.calledWithMatch({
      data: "{ password: '***' }"
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

  it("should create a log entry with the current date", () => {
    logger.info("Some message");
    expect(mockLogger.log).to.have.been.calledWithMatch({date: currentDate.toISOString()});
  });

  describe("data serialization", () => {
    it("should correctly serialize a string by returning the unmodified string", () => {
      logger.info("Some message", "some data");
      expect(mockLogger.log).to.have.been.calledWithMatch({
        data: "some data"
      });
    });

    it("should correctly serialize a number ", () => {
      logger.info("Some message", -47682.36);
      expect(mockLogger.log).to.have.been.calledWithMatch({
        data: "-47682.36"
      });
    });

    it("should correctly serialize the number 0", () => {
      logger.info("Some message", 0);
      expect(mockLogger.log).to.have.been.calledWithMatch({
        data: "0"
      });
    });

    it("should serialize 'null' as an empty string", () => {
      logger.info("Some message", null);
      expect(mockLogger.log).to.have.been.calledWithMatch({
        data: ""
      });
    });

    it("should serialize 'undefined' as an empty string", () => {
      logger.info("Some message", undefined);
      expect(mockLogger.log).to.have.been.calledWithMatch({
        data: ""
      });
    });

    it("should correctly serialize an error", () => {
      const error = new Error("Some message");
      logger.info("Some message", error);
      expect(mockLogger.log).to.have.been.calledWithMatch({
        data: `\n${util.inspect(error)}`
      });
    });

    it("should correctly serialize an object", () => {
      logger.info("Some message", {
        someProperty: "some value",
        someChildObject: {
          someOtherProperty: "some other value"
        }
      });
      expect(mockLogger.log).to.have.been.calledWithMatch({
        data: "{ someProperty: 'some value', someChildObject: { someOtherProperty: 'some other value' } }"
      });
    });

    it("should correctly serialize an empty object", () => {
      logger.info("Some message", {});
      expect(mockLogger.log).to.have.been.calledWithMatch({
        data: "{}"
      });
    });

    it("should correctly serialize an object which contains a very long string", () => {
      const longString = chance.string({length: 400});
      logger.info("Some message", {someProperty: longString});
      expect(mockLogger.log).to.have.been.calledWithMatch({
        data: `{ someProperty: '${longString}' }`
      });
    });

    it("should serialize an array of values by printing each value on a separate line", () => {
      logger.info("Some message", [
        "Some string",
        2237,
        {someProperty: "some value"}
      ]);
      expect(mockLogger.log).to.have.been.calledWithMatch({
        data: "Some string\n2237\n{ someProperty: 'some value' }"
      });
    });

    it("should serialize an empty array as an empty string", () => {
      logger.info("Some message", []);
      expect(mockLogger.log).to.have.been.calledWithMatch({
        data: ""
      });
    });

    it("should ignore 'undefined' and 'null' values in an array", () => {
      logger.info("Some message", [1, undefined, 2, null, 3, 4]);
      expect(mockLogger.log).to.have.been.calledWithMatch({
        data: "1\n2\n3\n4"
      });
    });

    it("should correctly serialize 'NaN'", () => {
      logger.info("Some message", NaN);
      expect(mockLogger.log).to.have.been.calledWithMatch({
        data: "NaN"
      });
    });

    it("should correctly serialize 'Infinity'", () => {
      logger.info("Some message", Infinity);
      expect(mockLogger.log).to.have.been.calledWithMatch({
        data: "Infinity"
      });
    });

    it("should serialize a NodeJS 'IncomingMessage' by including its 'headers' and 'body'", () => {
      const incomingMessage = new IncomingMessage();
      incomingMessage.headers = {
        "content-type": "application/json"
      };
      incomingMessage.body = {
        someProperty: "some value"
      };

      logger.info("Some message", incomingMessage);
      expect(mockLogger.log).to.have.been.calledWithMatch({
        data: "{ headers: { 'content-type': 'application/json' }, body: { someProperty: 'some value' } }"
      });
    });

    it("should serialize a Set as an empty Set", () => {
      // This behaviour should be changed in the future
      logger.info("Some message", new Set([1, 2, 3]));
      expect(mockLogger.log).to.have.been.calledWithMatch({
        data: "Set {}"
      });
    });

    it( "should serialize a Map as an empty Map", () => {
      // This behaviour should be changed in the future
      const map = new Map();
      map.set("someProperty", "some value");

      logger.info("Some message", map);
      expect(mockLogger.log).to.have.been.calledWithMatch({
        data: "Map {}"
      });
    });
  });
});
