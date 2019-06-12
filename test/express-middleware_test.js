const {expect} = require("chai");
const Chance = require("chance");
const chance = new Chance();
const {LoggerFactory} = require("../src/logger-factory");
const {Logger} = require("../src/logger");
const {expressMiddleware} = require("../src/express-middleware");
const {CONSOLE_OUTPUT} = require("../constants");


function fail() {
  throw new Error("Test failed");
}


describe("expressMiddleware", () => {
  let serverId = null;
  let loggerFactory = null;
  let middleware = null;
  const res = null;

  beforeEach(() => {
    serverId = chance.hash();
    loggerFactory = new LoggerFactory({serverId, outputDestinations: [CONSOLE_OUTPUT]});
    middleware = expressMiddleware(loggerFactory);
  });


  async function runMiddleware(req, res) {
    return new Promise((resolve, reject) => {
      middleware(req, res, (err) => {
        if (err) {
          return reject(err);
        }
        return resolve();
      });
    })
  }


  it("should create middleware that assigns a logger to the 'req' object, that knows the AWS trace ID for the request", async () => {
    const req = {headers: {"x-amzn-trace-id": chance.hash()}};
    await runMiddleware(req, res);

    expect(req.logger).to.exist;
    expect(req.logger).to.be.an.instanceOf(Logger);
    expect(req.logger.options.traceId).to.eql(req.headers["x-amzn-trace-id"]);
  });

  it("should replace occurences of the '=' symbol in the AWS trace ID with the symbol '-' instead", async () => {
    const req = {headers: {"x-amzn-trace-id": "A=1=B=2"}};
    await runMiddleware(req, res);

    expect(req.logger).to.exist;
    expect(req.logger.options.traceId).to.eql(req.headers["x-amzn-trace-id"].replace("=", "-"));
  });

  it("should create middleware that assigns a logger to the 'req' object with a trace ID of 'null' " +
    "when the request headers do not contain an AWS trace ID", async () => {
    const req = {headers: {}};
    await runMiddleware(req, res);

    expect(req.logger).to.exist;
    expect(req.logger.options.traceId).to.eql(null);
  });

  it("should yield an error if the 'req' object already has a logger assigned", async () => {
    const req = {headers: {}, logger: {}};

    try {
      await runMiddleware(req, res);
      fail();
    } catch (err) {
      expect(err.message).to.eql("req.logger has already been assigned")
    }
  });

  it("should throw an error if a loggerFactory is not provided", () => {
    function sut() {
      return expressMiddleware();
    }

    expect(sut).to.throw("loggerFactory is required");
  });
});
