const assert = require("node:assert/strict");
const {describe, it} = require("node:test");

describe("SilentLogger", () => {
  const {SilentLogger} = require("../index");

  it("should respond to .log", () => {
    let logger = new SilentLogger();
    assert.strictEqual(typeof logger.log, "function");
  });

  it("should respond to .debug", () => {
    let logger = new SilentLogger();
    assert.strictEqual(typeof logger.debug, "function");
  });

  it("should respond to .info", () => {
    let logger = new SilentLogger();
    assert.strictEqual(typeof logger.info, "function");
  });

  it("should respond to .error", () => {
    let logger = new SilentLogger();
    assert.strictEqual(typeof logger.error, "function");
  });

  it("should respond to .fatal", () => {
    let logger = new SilentLogger();
    assert.strictEqual(typeof logger.fatal, "function");
  });

  it("should respond to .write", () => {
    let logger = new SilentLogger();
    assert.strictEqual(typeof logger.write, "function");
  });
});
