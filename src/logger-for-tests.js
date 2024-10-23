const {Logger} = require("./logger");

const FATAL_LOG_LEVEL = Logger.LogLevel().FATAL;

class LoggerForTests extends Logger {
  #buffer = [];
  #shouldBuffer = true;

  _log(tokens) {
    if (tokens.level === FATAL_LOG_LEVEL) {
      // A fatal log is important and typically indicates an error with a test, or an unhandled rejection in Node.
      // If one occurs, stop buffering and begin emitting all logs immediately so that developers notice it.
      this.#shouldBuffer = false;
      this.flushBuffer();
    }

    if (this.#shouldBuffer) {
      this.#buffer.push(tokens);
    } else {
      super._log(tokens);
    }
  }

  flushBuffer() {
    for (const tokens of this.#buffer) {
      super._log(tokens);
    }

    this.clearBuffer();
  }

  clearBuffer() {
    this.#buffer = [];
  }

  onTestFinished(currentTest) {
    if (currentTest.state === "failed") {
      this.flushBuffer();
    } else {
      this.clearBuffer();
    }

    // Resume buffering logs for the next test
    this.#shouldBuffer = true;
  }
}

module.exports = {LoggerForTests};
