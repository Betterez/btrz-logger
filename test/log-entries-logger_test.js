const {expect} = require("chai");
const sinon = require("sinon");
const sandbox = sinon.createSandbox();
const logentries = require("node-logentries");
const {LogEntriesLogger} = require("../src/log-entries-logger");


describe("LogEntriesLogger", () => {

  afterEach(() => {
    sandbox.restore();
  });

  describe("constructor", () => {
    it("should throw an error if no api token is provided", () => {
      function sut() {
        return new LogEntriesLogger({});
      }

      expect(sut).to.throw("a token is required to connect to logentries");
    });

    it("should re-use existing connections to LogEntries when an existing connection was created for the same api token", () => {
      const logEntriesLoggerSpy = sandbox.spy(logentries, "logger");

      let logEntriesLogger = new LogEntriesLogger({token: "A"});
      expect(logEntriesLoggerSpy.callCount).to.eql(1);
      expect(logEntriesLogger.logger).to.eql(logEntriesLoggerSpy.getCall(0).returnValue);

      // Create another instance with the same logentries token.  We expect the logentries logger from the first instance to be re-used.
      logEntriesLogger = new LogEntriesLogger({token: "A"});
      expect(logEntriesLoggerSpy.callCount).to.eql(1);
      expect(logEntriesLogger.logger).to.eql(logEntriesLoggerSpy.getCall(0).returnValue);

      // Create another instance with a different logentries token.  We expect a new logentries logger to be created.
      logEntriesLogger = new LogEntriesLogger({token: "B"});
      expect(logEntriesLoggerSpy.callCount).to.eql(2);
      expect(logEntriesLogger.logger).to.eql(logEntriesLoggerSpy.getCall(1).returnValue);
    });
  });
});
