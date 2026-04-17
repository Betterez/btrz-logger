const assert = require("node:assert/strict");
const {describe, it} = require("node:test");

describe("LogEntriesLogger", () => {
  const Logger = require("r7insight_node");
  const {LogEntriesLogger} = require("../src/log-entries-logger");

  describe("constructor", () => {
    it("should throw an error if no api token is provided", () => {
      function sut() {
        return new LogEntriesLogger({});
      }

      assert.throws(sut, /a token is required to connect to logentries/);
    });

    it("should re-use existing connections to LogEntries when an existing connection was created for the same api token", () => {
      let logEntriesLogger1 = new LogEntriesLogger({token: "d4d3c79f-fbdd-41f5-91ec-6a3dc849166c"});
      let logEntriesLogger2 = new LogEntriesLogger({token: "d4d3c79f-fbdd-41f5-91ec-6a3dc849166c"});
      let logEntriesLogger3 = new LogEntriesLogger({token: "d4d3c79f-fbdd-41f5-91ec-6a3dc849166a"});
      let logEntriesLogger4 = new LogEntriesLogger({token: "d4d3c79f-fbdd-41f5-91ec-6a3dc849166a"});
      let logEntriesLogger5 = new LogEntriesLogger({token: "d4d3c79f-fbdd-41f5-91ec-6a3dc849166b"});
      assert.ok(logEntriesLogger1.logger instanceof Logger);
      assert.ok(logEntriesLogger2.logger instanceof Logger);
      assert.ok(logEntriesLogger3.logger instanceof Logger);
      assert.ok(logEntriesLogger4.logger instanceof Logger);
      assert.ok(logEntriesLogger5.logger instanceof Logger);
      assert.strictEqual(logEntriesLogger1.logger, logEntriesLogger2.logger);
      assert.strictEqual(logEntriesLogger3.logger, logEntriesLogger4.logger);
      assert.notStrictEqual(logEntriesLogger1.logger, logEntriesLogger3.logger);
      assert.notStrictEqual(logEntriesLogger1.logger, logEntriesLogger4.logger);
      assert.notStrictEqual(logEntriesLogger1.logger, logEntriesLogger5.logger);
      assert.notStrictEqual(logEntriesLogger2.logger, logEntriesLogger3.logger);
      assert.notStrictEqual(logEntriesLogger2.logger, logEntriesLogger4.logger);
      assert.notStrictEqual(logEntriesLogger2.logger, logEntriesLogger5.logger);
    });

    it("should throw an error if the LogEntries connection fails", () => {
      let logEntriesLogger = new LogEntriesLogger({token: "d4d3c79f-fbdd-41f5-91ec-6a3dc849166d"});
      assert.strictEqual(typeof logEntriesLogger.logger.log, "function");
    });
    it("should log level info", () => {
      let logEntriesLogger = new LogEntriesLogger({token: "d4d3c79f-fbdd-41f5-91ec-6a3dc849166d"});
      assert.doesNotThrow(() => logEntriesLogger.logger.log("info", "test"));
    });
    it("should log level error", () => {
      let logEntriesLogger = new LogEntriesLogger({token: "d4d3c79f-fbdd-41f5-91ec-6a3dc849166d"});
      assert.doesNotThrow(() => logEntriesLogger.logger.log("error", "test"));
    });
    it("should log level debug", () => {
      let logEntriesLogger = new LogEntriesLogger({token: "d4d3c79f-fbdd-41f5-91ec-6a3dc849166d"});
      assert.doesNotThrow(() => logEntriesLogger.logger.log("debug", "test"));
    });
    it("should log level fatal", () => {
      let logEntriesLogger = new LogEntriesLogger({token: "d4d3c79f-fbdd-41f5-91ec-6a3dc849166d"});
      assert.doesNotThrow(() => logEntriesLogger.logger.log("fatal", "test"));
    });
  });
});
