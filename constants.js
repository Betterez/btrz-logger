const CONSOLE_OUTPUT = "CONSOLE_OUTPUT";
const LOGENTRIES_OUTPUT = "LOGENTRIES_OUTPUT";
const SILENT_OUTPUT = "SILENT_OUTPUT";


const constants = {
  CONSOLE_OUTPUT,
  LOGENTRIES_OUTPUT,
  SILENT_OUTPUT,
  ALL_OUTPUT_DESTINATIONS: [CONSOLE_OUTPUT, LOGENTRIES_OUTPUT, SILENT_OUTPUT],
  LOG_LEVEL_DEBUG: "debug",
  LOG_LEVEL_INFO: "info",
  LOG_LEVEL_NOTICE: "notice",
  LOG_LEVEL_WARNING: "warning",
  LOG_LEVEL_ERROR: "err",
  LOG_LEVEL_CRITICAL: "crit",
  LOG_LEVEL_ALERT: "alert",
  LOG_LEVEL_EMERGENCY: "emerg"
};

module.exports = constants;
