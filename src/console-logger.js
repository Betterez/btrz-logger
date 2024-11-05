const logCleaner = require("./log-cleaner");
const util = require("util");
const color = require("ansi-color").set;
const colorFromLevel = {
  info: "yellow",
  debug: "blue",
  error: "red",
  fatal: "red_bg+white"
};

function serialize(value) {
  if (Array.isArray(value)) {
    return value
      .map(serialize)
      .join("\n");
  }

  if (typeof value === "string" || typeof value === "number") {
    return value;
  } else if (!value) {
    return "";
  } else if (value.stack) {
    // value is an error-like object
    return "\n" + util.inspect(value);
  } else {
    return "\n" + util.inspect(value, {showHidden: true, depth: 4, compact: false, breakLength: Infinity});
  }
}

class ConsoleLogger {
  log(tokens) {
    let msg = `${tokens.level.toUpperCase()}\t${tokens.date} \t${tokens.serverId}\t${tokens.traceId}`;

    if (tokens.message) {
      msg += `\t${tokens.message}`;
    }
    if (tokens.data) {
      msg += `\t${serialize(tokens.data)}`;
    }

    console.error(color(msg, colorFromLevel[tokens.level.toLowerCase()]));
  }

  // Used for Express logger
  write(buf) {
    let cleanBuf = logCleaner.sanitizeUrlRawParameters(buf);
    console.error(cleanBuf);
  }
}

// For backwards compatibility
ConsoleLogger.prototype.error = ConsoleLogger.prototype.log;

exports.ConsoleLogger = ConsoleLogger;
