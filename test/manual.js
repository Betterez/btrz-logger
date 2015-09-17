"use strict";

describe("console", function () {
  let logger;
  beforeEach(function () {
    let Logger = require("../index").Logger,
      ConsoleLogger = require("../index").ConsoleLogger,
      LogEntriesLogger = require("../index").LogEntriesLogger,
      logger = new Logger();
    logger.addLogger(new ConsoleLogger());
    logger.addLogger(new LogEntriesLogger({token: "fake-token-here"}));
  });

  it("should log to console", function () {

    // logger.debug("Hello log", new Error("err"));
    // logger.info("Hello info", new Error("err"));
    // logger.error("Hello error", new Error("err"));
    // logger.fatal("Hello fatal", new Error("err"));
    // logger.debug("Hello debug 2", {d: new Date(), some: "info", and: new Error("err")});
    // logger.log("info", "some message");
  });
});
