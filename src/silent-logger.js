"use strict";

class SilentLogger {

  log() {}

  debug() {}

  info() {}

  error() {}

  fatal() {}

  // Used for Express logger
  write() {}
}

exports.SilentLogger = SilentLogger;
