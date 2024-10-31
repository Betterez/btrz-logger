const MAX_DEPTH = 15;
const MAX_LOG_BODY_LENGTH = 4096;
const SANITIZATION_TIME_BUDGET_IN_MILLISECONDS = 10;
const TRUNCATED_MESSAGE = "[TRUNCATED]";
const creditCardRegx = `(?:4[0-9]{12}(?:[0-9]{3})?|(?:5[1-5][0-9]{2}|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\\d{3})\\d{11}|6(?:011|5[0-9]{2})[0-9]{12})`;
const flaggedFields = new Set(["email", "mail", "password", "ccnumber", "ccard", "credentials", "user", "firstName", "lastName", "address", "phone", "didyoumean", "createdByUserEmail", "updatedByUserEmail"]);

function sanitizeUrlRawParameters(urlString) {
  let newUrlString = urlString;
  try {
    newUrlString = decodeURIComponent(urlString);
  } catch (e) {
    // ignore decoding errors and proceed with original data
  }

  newUrlString = newUrlString.replace(/\[firstName\]=[^\&\"]*/g, "[firstName]=***");
  newUrlString = newUrlString.replace(/\[lastName\]=[^\&\"]*/g, "[lastName]=***");
  newUrlString = newUrlString.replace(/\[email\]=\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b/g, "[email]=***@***.***");
  return newUrlString;
}

/**
 * @param {AxiosError} error
 * @param {Number} startTime
 */
function _sanitizeAxiosError(error, startTime) {
  const {method = "UNKNOWN_HTTP_METHOD", baseURL = "", url = ""} = /** @type {InternalAxiosRequestConfig} */ error.config;
  let errorStr = `[${error.code}] Request failed`;
  let sanitizedResponseData = "";

  if (error.response) {
    const {status, data} = error.response;
    errorStr = `${errorStr} with status ${status}`;

    if (typeof data === "string") {
      sanitizedResponseData = _sanitizeString(data);
    } else {
      try {
        const sanitizedResponse = JSON.stringify(_sanitize(data, 1, startTime).sanitizedValue);
        sanitizedResponseData = sanitizedResponse.substring(0, MAX_LOG_BODY_LENGTH);
      } catch (e) {
        // Ignore error
      }
    }
  }

  errorStr = `${errorStr}: [${method.toUpperCase()}] ${baseURL}${baseURL && !baseURL.endsWith("/") && !url.startsWith("/") ? "/" : ""}${url}`;

  return sanitizedResponseData ? `${errorStr}\n${sanitizedResponseData}` : errorStr;
}

function _sanitizeString(value) {
  let sanitizedValue = value;

  if (sanitizedValue.length > MAX_LOG_BODY_LENGTH) {
    sanitizedValue = sanitizedValue.substring(0, MAX_LOG_BODY_LENGTH) + ` ${TRUNCATED_MESSAGE}`;
  }

  sanitizedValue = sanitizedValue.replace(/\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b/g, "regx.email.replaced");
  sanitizedValue = sanitizedValue.replace(new RegExp(creditCardRegx, "gm"), "regx.ccnumber.replaced");
  return sanitizedValue;
}

function _sanitize(value, currentDepth , startTime) {
  if (new Date().valueOf() > startTime + SANITIZATION_TIME_BUDGET_IN_MILLISECONDS) {
    return {sanitizedValue: TRUNCATED_MESSAGE, outOfTime: true};
  } else if (currentDepth > MAX_DEPTH) {
    return {sanitizedValue: TRUNCATED_MESSAGE};
  } else if (value === undefined || value === null) {
    return {sanitizedValue: value};
  } else if (typeof value === "string") {
    return {sanitizedValue: _sanitizeString(value)};
  } else if (Array.isArray(value)) {
    const sanitizedValue = [];

    for (const arrayItem of value) {
      const {sanitizedValue: sanitizedArrayItem, outOfTime} = _sanitize(arrayItem, currentDepth + 1, startTime);
      sanitizedValue.push(sanitizedArrayItem);
      if (outOfTime) {
        return {sanitizedValue, outOfTime};
      }
    }

    return {sanitizedValue};
  } else if (typeof value === "object" && value.constructor?.name === "AxiosError") {
    return {sanitizedValue: _sanitizeAxiosError(value, startTime)};
  } else if (typeof value === "object") {
    const sanitizedObject = {};

    const ownPropertyNames = Object.getOwnPropertyNames(value);
    for (const key of ownPropertyNames) {
      const baseKey = key.toLowerCase().replaceAll("_", "");
      if (flaggedFields.has(baseKey)) {
        sanitizedObject[key] = "***";
      } else {
        const {sanitizedValue, outOfTime} = _sanitize(value[key], currentDepth + 1, startTime);
        sanitizedObject[key] = sanitizedValue;
        if (outOfTime) {
          return {sanitizedValue: sanitizedObject, outOfTime};
        }
      }
    }

    return {sanitizedValue: sanitizedObject};
  } else {
    return {sanitizedValue: value};
  }
}

function sanitize(value) {
  const startTime = new Date().valueOf();
  return _sanitize(value, 0, startTime).sanitizedValue;
}

module.exports = { sanitizeUrlRawParameters, sanitize }
