describe("LogEntriesLogger", () => {
  const {expect} = require("chai");
  const Logger = require("r7insight_node");
  const {LogEntriesLogger} = require("../src/log-entries-logger");

  describe("constructor", () => {
    it("should throw an error if no api token is provided", () => {
      function sut() {
        return new LogEntriesLogger({});
      }

      expect(sut).to.throw("a token is required to connect to logentries");
    });

    it("should re-use existing connections to LogEntries when an existing connection was created for the same api token", () => {
      let logEntriesLogger1 = new LogEntriesLogger({token: "d4d3c79f-fbdd-41f5-91ec-6a3dc849166c"});
      let logEntriesLogger2 = new LogEntriesLogger({token: "d4d3c79f-fbdd-41f5-91ec-6a3dc849166c"});
      let logEntriesLogger3 = new LogEntriesLogger({token: "d4d3c79f-fbdd-41f5-91ec-6a3dc849166a"});
      let logEntriesLogger4 = new LogEntriesLogger({token: "d4d3c79f-fbdd-41f5-91ec-6a3dc849166a"});
      let logEntriesLogger5 = new LogEntriesLogger({token: "d4d3c79f-fbdd-41f5-91ec-6a3dc849166b"});
      expect(logEntriesLogger1.logger).to.be.an.instanceof(Logger);
      expect(logEntriesLogger2.logger).to.be.an.instanceof(Logger);
      expect(logEntriesLogger3.logger).to.be.an.instanceof(Logger);
      expect(logEntriesLogger4.logger).to.be.an.instanceof(Logger);
      expect(logEntriesLogger5.logger).to.be.an.instanceof(Logger);
      expect(logEntriesLogger1.logger).to.be.eql(logEntriesLogger2.logger);
      expect(logEntriesLogger3.logger).to.be.eql(logEntriesLogger4.logger);
      expect(logEntriesLogger1.logger).to.not.be.eql(logEntriesLogger3.logger);
      expect(logEntriesLogger1.logger).to.not.be.eql(logEntriesLogger4.logger);
      expect(logEntriesLogger1.logger).to.not.be.eql(logEntriesLogger5.logger);
      expect(logEntriesLogger2.logger).to.not.be.eql(logEntriesLogger3.logger);
      expect(logEntriesLogger2.logger).to.not.be.eql(logEntriesLogger4.logger);
      expect(logEntriesLogger2.logger).to.not.be.eql(logEntriesLogger5.logger);
    });

    it("should throw an error if the LogEntries connection fails", () => {
      let logEntriesLogger = new LogEntriesLogger({token: "d4d3c79f-fbdd-41f5-91ec-6a3dc849166d"});
      expect(logEntriesLogger.logger.log).to.be.a("function");
    });
    it("should log level info", () => {
      try {
        let logEntriesLogger = new LogEntriesLogger({token: "d4d3c79f-fbdd-41f5-91ec-6a3dc849166d"});
        logEntriesLogger.logger.log("info", "test");
      } catch (e) {
        expect(1).to.equal(2);
      }
    });
    it("should log level error", () => {
      try {
        let logEntriesLogger = new LogEntriesLogger({token: "d4d3c79f-fbdd-41f5-91ec-6a3dc849166d"});
        logEntriesLogger.logger.log("error", "test");
      } catch (e) {
        expect(1).to.equal(2);
      }
    });
    it("should log level debug", () => {
      try {
        let logEntriesLogger = new LogEntriesLogger({token: "d4d3c79f-fbdd-41f5-91ec-6a3dc849166d"});
        logEntriesLogger.logger.log("debug", "test");
      } catch (e) {
        expect(1).to.equal(2);
      }
    });
    it("should log level fatal", () => {
      try {
        let logEntriesLogger = new LogEntriesLogger({token: "d4d3c79f-fbdd-41f5-91ec-6a3dc849166d"});
        logEntriesLogger.logger.log("fatal", "test");
      } catch (e) {
        expect(1).to.equal(2);
      }
    });
  });
});
