"use strict";

let util = require("util"),
  color = require("ansi-color").set,
  colorFromLevel = {
    info: "yellow",
    debug: "blue",
    error: "red",
    fatal: "red_bg+white"
  };

class ConsoleLogger {
  error(tokens) {
    let msg = `${tokens.level.toUpperCase()}\t${tokens.date} ${tokens.time}\t${tokens.serverId}\t${tokens.message}`;

    if (tokens.data) {
      msg += `\t${util.inspect(tokens.data)}`;
    }
    console.error(color(msg, colorFromLevel[tokens.level.toLowerCase()]));
  }
  // Used for Express logger
  write(buf) {
    console.error(buf);
  }
}

exports.ConsoleLogger = ConsoleLogger;
