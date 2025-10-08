const logCleaner = require("./log-cleaner");
const {format} = require("./formatting");

class ConsoleLogger {
  constructor(options = {}) {
    this.colorize = options.colorize ?? true;
  }

  log(tokens) {
    console.log(format(tokens, this.colorize));
  }

  // Used for Express logger
  write(buf) {
    let cleanBuf = logCleaner.sanitizeUrlRawParameters(buf);
    console.log(cleanBuf);
  }
}

// For backwards compatibility
ConsoleLogger.prototype.error = ConsoleLogger.prototype.log;

module.exports = {
  ConsoleLogger,
  format
};
