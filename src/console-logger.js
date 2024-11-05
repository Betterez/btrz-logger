const logCleaner = require("./log-cleaner");
const color = require("ansi-color").set;
const colorFromLevel = {
  info: "yellow",
  debug: "blue",
  error: "red",
  fatal: "red_bg+white"
};

class ConsoleLogger {
  log(tokens) {
    let msg = `${tokens.level.toUpperCase()}\t${tokens.date} \t${tokens.serverId}\t${tokens.traceId}`;

    if (tokens.message) {
      msg += `\t${tokens.message}`;
    }
    if (tokens.data) {
      msg += `\t${tokens.data}`;
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
