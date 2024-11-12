const {expect} = require("chai");
const Chance = require("chance");
const chance = new Chance();
const util = require("node:util");
const {IncomingMessage} = require("node:http");
const sinon = require("sinon");
const {Logger, ConsoleLogger} = require("../index");

describe("ConsoleLogger", () => {
  let serverId;
  let traceId;
  let consoleLogger;
  let logger;
  let clock;
  let currentDate;
  let logPrefix;

  beforeEach(() => {
    serverId = `server-${chance.hash({length: 4})}`;
    traceId = `trace-${chance.hash({length: 4})}`;
    consoleLogger = new ConsoleLogger({colorize: false});
    sinon.spy(console, "log");

    logger = new Logger({serverId, traceId});
    logger.addLogger(consoleLogger);

    currentDate = new Date();
    clock = sinon.useFakeTimers(currentDate);

    logPrefix = `INFO\t${currentDate.toISOString()} \t${serverId}#${process.pid}\t${traceId}`;
  });

  afterEach(() => {
    clock.restore();
    sinon.restore();
  });

  it("should output a string containing the log level, current date, server ID, process ID, and trace ID", () => {
    logger.info("");
    expect(console.log).to.have.been.calledOnceWith(`INFO\t${currentDate.toISOString()} \t${serverId}#${process.pid}\t${traceId}`);
  });

  it("should output the message that was logged", () => {
    logger.info("Some message");
    expect(console.log).to.have.been.calledOnceWith(`${logPrefix}\tSome message`);
  });

  it("should serialize and output an object when one is logged", () => {
    logger.info({someProperty: "some value"});
    expect(console.log).to.have.been.calledOnceWith(`${logPrefix}\t\n{\n  someProperty: 'some value'\n}`);
  });

  it("should output a message with the correct severity", () => {
    logger.debug("Some message");
    expect(console.log.args[0][0]).to.contain("DEBUG")

    sinon.reset();
    logger.info("Some message");
    expect(console.log.args[0][0]).to.contain("INFO")

    sinon.reset();
    logger.error("Some message");
    expect(console.log.args[0][0]).to.contain("ERROR")

    sinon.reset();
    logger.fatal("Some message");
    expect(console.log.args[0][0]).to.contain("FATAL")
  });

  describe("data serialization", () => {
    beforeEach(() => {
      logPrefix = `INFO\t${currentDate.toISOString()} \t${serverId}#${process.pid}\t${traceId}\tSome message`;
    });

    function expectStringWasLogged(string) {
      expect(console.log).to.have.been.calledOnceWith(`${logPrefix}\t${string}`);
    }

    it("should correctly serialize a string by returning the unmodified string", () => {
      logger.info("Some message", "some data");
      expectStringWasLogged("some data");
    });

    it("should correctly serialize a number ", () => {
      logger.info("Some message", -47682.36);
      expectStringWasLogged("-47682.36");
    });

    it("should correctly serialize the number 0", () => {
      logger.info("Some message", 0);
      expectStringWasLogged("0");
    });

    it("should correctly serialize 'null'", () => {
      logger.info("Some message", null);
      expectStringWasLogged("null");
    });

    it("should not serialize the value 'undefined'", () => {
      logger.info("Some message", undefined);
      expect(console.log).to.have.been.calledOnceWith(logPrefix);
    });

    it("should correctly serialize an error", () => {
      const error = new Error("Some message");
      logger.info("Some message", error);
      expectStringWasLogged(`\n${util.inspect(error)}`);
    });

    it("should correctly serialize an object", () => {
      logger.info("Some message", {
        someProperty: "some value",
        someChildObject: {
          someOtherProperty: "some other value"
        }
      });
      expectStringWasLogged("\n" +
        "{\n" +
        "  someProperty: 'some value',\n" +
        "  someChildObject: {\n" +
        "    someOtherProperty: 'some other value'\n" +
        "  }\n" +
        "}");
    });

    it("should correctly serialize an empty object", () => {
      logger.info("Some message", {});
      expectStringWasLogged("\n{}");
    });

    it("should correctly serialize an object which contains a very long string", () => {
      const longString = chance.string({length: 400});
      logger.info("Some message", {someProperty: longString});
      expectStringWasLogged(`\n{\n  someProperty: '${longString}'\n}`)
    });

    it("should serialize an array of values by printing each value on a separate line", () => {
      logger.info("Some message", [
        "Some string",
        2237,
        {someProperty: "some value"}
      ]);
      expectStringWasLogged("Some string\n" +
        "2237\n" +
        "\n" +
        "{\n" +
        "  someProperty: 'some value'\n" +
        "}");
    });

    it("should serialize an empty array as an empty string", () => {
      logger.info("Some message", []);
      expectStringWasLogged("");
    });

    it("should correctly serialize 'NaN'", () => {
      logger.info("Some message", NaN);
      expectStringWasLogged("NaN");
    });

    it("should correctly serialize 'Infinity'", () => {
      logger.info("Some message", Infinity);
      expectStringWasLogged("Infinity");
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
      expectStringWasLogged("\n" +
        "{\n" +
        "  headers: {\n" +
        "    'content-type': 'application/json'\n" +
        "  },\n" +
        "  body: {\n" +
        "    someProperty: 'some value'\n" +
        "  }\n" +
        "}");
    });

    it("should serialize a Set as an empty Set", () => {
      // This behaviour should be changed in the future
      logger.info("Some message", new Set([1, 2, 3]));
      expectStringWasLogged("\nSet {}");
    });

    it( "should serialize a Map as an empty Map", () => {
      // This behaviour should be changed in the future
      const map = new Map();
      map.set("someProperty", "some value");

      logger.info("Some message", map);
      expectStringWasLogged("\nMap {}");
    });
  });
});
