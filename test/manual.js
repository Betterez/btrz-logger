"use strict";

describe("console", function () {
  let logger
  beforeEach(function () {
    logger = require("../index").create({loggers:{console: {provider: "console"}}});
    logger.addLogger("console");
    logger.addLogger("log-entries");
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
