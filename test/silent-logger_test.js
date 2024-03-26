describe("SilentLogger", () => {
  const {SilentLogger} = require("../index");
  const {expect} = require("chai");

  it("should respond to .log", () => {
    let logger = new SilentLogger();
    expect(logger).to.respondTo("log");
  });

  it("should respond to .debug", () => {
    let logger = new SilentLogger();
    expect(logger).to.respondTo("debug");
  });

  it("should respond to .info", () => {
    let logger = new SilentLogger();
    expect(logger).to.respondTo("info");
  });

  it("should respond to .error", () => {
    let logger = new SilentLogger();
    expect(logger).to.respondTo("error");
  });

  it("should respond to .fatal", () => {
    let logger = new SilentLogger();
    expect(logger).to.respondTo("fatal");
  });

  it("should respond to .write", () => {
    let logger = new SilentLogger();
    expect(logger).to.respondTo("write");
  });
});
