"use strict";

describe("console", function () {

  let logger;

  beforeEach(function () {
    let Logger = require("../index").Logger,
      ConsoleLogger = require("../index").ConsoleLogger,
      LogEntriesLogger = require("../index").LogEntriesLogger;
    logger = new Logger();
    logger.addLogger(new ConsoleLogger());
    logger.addLogger(new LogEntriesLogger({token: "fake-token-here"}));
  });

  it("should log to console", function () {
    // logger.info("info", {info: "some"});
    // logger.error({info: "some"}, "some");
    // logger.error({info: "some"}, {tokens: "token"});
    // logger.error({info: "some"}, [{tokens: "token"}, [{second: "two"}]]);
  });
});
