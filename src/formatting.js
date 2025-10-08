const util = require("node:util");
const {set: color} = require("ansi-color");

const colorByLogLevel = {
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
    return util.inspect(value);
  } else if (value.stack) {
    // value is an error-like object
    return "\n" + util.inspect(value);
  } else {
    return "\n" + util.inspect(value, {showHidden: true, depth: 4, compact: false, breakLength: Infinity});
  }
}

function format(tokens, colorize) {
  let message = `${tokens.level.toUpperCase()}\t${tokens.date} \t${tokens.serverId}\t${tokens.traceId}`;

  if (tokens.message) {
    message += `\t${tokens.message}`;
  }
  if (tokens.data !== undefined && tokens.data !== "") {
    message += `\t${serialize(tokens.data)}`;
  }

  if (colorize) {
    return color(message, colorByLogLevel[tokens.level.toLowerCase()]);
  } else {
    return message;
  }
}

module.exports = {
  format
};
