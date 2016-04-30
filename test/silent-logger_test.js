"use strict";

describe("SilentLogger", () => {

  const SilentLogger = require("../index").SilentLogger,
    expect = require("chai").expect;

  it("should response to .error", () => {
    let logger = new SilentLogger();
    expect(logger).to.respondTo("error");
  });
  it("should response to .write", () => {
    let logger = new SilentLogger();
    expect(logger).to.respondTo("write");
  });
});