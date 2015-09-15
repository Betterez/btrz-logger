"use strict";

let util = require("util"),
  color = require("ansi-color").set,
  colorFromLevel = {
    info: "yellow",
    debug: "blue",
    error: "red",
    fatal: "red_bg+white"
  };

exports.create = function () {
  return {
    error: function (tokens) {
      var msg = `${tokens.level.toUpperCase()}\t
      ${tokens.date} ${tokens.time}\t\t
      ${tokens.serverId}\t\t
      ${tokens.message}`;

      if (tokens.data) {
        msg += `\t\t\n${tokens.data}`;
      }
      util.error(color(msg, colorFromLevel[tokens.level.toLowerCase()]));
    },
    // Used for Express logger
    write: function (buf) {
      util.error(buf);
    }
  };
};
