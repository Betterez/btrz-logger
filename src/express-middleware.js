const assert = require("assert");


function getTraceId(req) {
  let traceId = null;
  const amazonTraceId = req.headers["x-amzn-trace-id"];

  if (amazonTraceId) {
    traceId = amazonTraceId.replace("=", "-");
  }

  return traceId;
}


function expressMiddleware(loggerFactory) {
  assert(loggerFactory, "loggerFactory is required");

  return (req, res, next) => {
    const traceId = getTraceId(req);

    try {
      assert(!req.logger, "req.logger has already been assigned");
      req.logger = loggerFactory.create({traceId});
    } catch (err) {
      return next(err);
    }

    return next();
  };
}


module.exports = {
  expressMiddleware
};
