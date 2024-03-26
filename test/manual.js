describe("console", function () {
  let logger = null;
  beforeEach(function () {
    const {Logger} = require("../index");
    const {ConsoleLogger} = require("../index");
    logger = new Logger({
      serverId: "12345",
      traceId: "trace_id_here"
    });
    logger.addLogger(new ConsoleLogger());
  });

  it("should log to console", function () {
    logger.info("info", {info: "some"});
    logger.error({info: "some"}, "some");
    logger.error({info: "some"}, {tokens: "token"});
    logger.error({info: "some"}, [{tokens: "token"}, [{second: "two"}]]);
  });
});
