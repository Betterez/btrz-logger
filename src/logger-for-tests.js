const {Logger} = require("./logger");

const FATAL_LOG_LEVEL = Logger.LogLevel().FATAL;

class LoggerForTests extends Logger {
  // Declare a buffer to hold log events.  The buffer is declared as a static property so that it is shared across
  // all instances of this class: it contains an in-order list of all log events issued to all instances of this class.
  static #buffer = [];
  static #shouldBuffer = true;

  _log(tokens) {
    if (tokens.level === FATAL_LOG_LEVEL) {
      // A fatal log is important and typically indicates an error with a test, or an unhandled rejection in Node.
      // If one occurs, stop buffering and begin emitting all logs immediately so that developers notice it.
      LoggerForTests.#shouldBuffer = false;
      LoggerForTests.flushBuffer();
    }

    if (LoggerForTests.#shouldBuffer) {
      LoggerForTests.#buffer.push({logger: this, tokens});
    } else {
      super._log(tokens);
    }
  }

  static flushBuffer() {
    for (const {logger, tokens} of LoggerForTests.#buffer) {
      Logger.prototype._log.call(logger, tokens);
    }

    LoggerForTests.clearBuffer();
  }

  static clearBuffer() {
    LoggerForTests.#buffer = [];
  }

  static onTestFinished(currentTest) {
    if (currentTest.state === "failed") {
      LoggerForTests.flushBuffer();
    } else {
      LoggerForTests.clearBuffer();
    }

    // Resume buffering logs for the next test
    LoggerForTests.#shouldBuffer = true;
  }
}

module.exports = {LoggerForTests};
