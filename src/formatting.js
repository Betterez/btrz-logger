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

function format(tokens, options = {}) {
  const logLevel = tokens.level.toUpperCase().padEnd(5, " ");
  const date = tokens.date;
  const serverId = tokens.serverId?.padEnd(15, " ") || "-";
  const amznTraceId = tokens.traceId || "-";
  const grafanaTraceId = tokens.grafanaTraceId || "-";
  const message = tokens.message ? ` ${tokens.message}` : "";
  const data = (tokens.data !== undefined && tokens.data !== "") ? ` ${serialize(tokens.data)}` : "";

  const output = `${logLevel} ${date} ${serverId} ${amznTraceId} ${grafanaTraceId}${message}${data}`;

  if (options.colorize) {
    const lowerCaseLogLevel = tokens.level.toLowerCase();
    const colorToApply = options.colors?.[lowerCaseLogLevel] || colorByLogLevel[lowerCaseLogLevel];
    return color(output, colorToApply);
  } else {
    return output;
  }
}

module.exports = {
  format
};
