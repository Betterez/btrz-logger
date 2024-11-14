const util = require("node:util");
const {IncomingMessage} = require("node:http");
const {ObjectId} = require("bson");

const MAX_DEPTH = 15;
const MAX_LOG_BODY_LENGTH = 4096;
const SANITIZATION_TIME_BUDGET_IN_MILLISECONDS = 10;
const TRUNCATED_MESSAGE = "[TRUNCATED]";
const creditCardRegx = `(?:4[0-9]{12}(?:[0-9]{3})?|(?:5[1-5][0-9]{2}|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\\d{3})\\d{11}|6(?:011|5[0-9]{2})[0-9]{12})`;
const sensitiveFieldPatterns = [
  /mail/, /user/, /firstname/, /lastname/, /address/, /phone/, /didyoumean/, /ccnumber/, /ccard/,
  /password/, /^pass$/, /credentials/, /authorization/, /key/, /token/, /secret/
];

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
      sanitizedResponseData = util.inspect(_sanitize(data, 1, startTime).sanitizedValue);
    }
  }

  errorStr = `${errorStr}: [${method.toUpperCase()}] ` +
    `${baseURL}${baseURL && !baseURL.endsWith("/") && !url.startsWith("/") ? "/" : ""}${url}` +
    (sanitizedResponseData ? `\n${sanitizedResponseData}` : "");

  if (errorStr.length > MAX_LOG_BODY_LENGTH) {
    errorStr = errorStr.substring(0, MAX_LOG_BODY_LENGTH - TRUNCATED_MESSAGE.length) + TRUNCATED_MESSAGE;
  }

  return errorStr;
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
  } else if (Array.isArray(value) || value instanceof Set) {
    const sanitizedValue = Array.isArray(value) ? [] : new Set();

    for (const arrayItem of value) {
      const {sanitizedValue: sanitizedItem, outOfTime} = _sanitize(arrayItem, currentDepth + 1, startTime);
      Array.isArray(value) ? sanitizedValue.push(sanitizedItem) : sanitizedValue.add(sanitizedItem);
      if (outOfTime) {
        return {sanitizedValue, outOfTime};
      }
    }

    return {sanitizedValue};
  } else if (typeof value === "object" && value.constructor?.name === "AxiosError") {
    return {sanitizedValue: _sanitizeAxiosError(value, startTime)};
  } else if (value instanceof Error) {
    return {sanitizedValue: value};
  } else if (value instanceof Date) {
    return {sanitizedValue: value};
  } else if (value instanceof IncomingMessage) {
    return _sanitize({headers: value.headers, body: value.body}, currentDepth + 1, startTime);
  } else if (value._bsontype === "ObjectID") {
    return {sanitizedValue: new ObjectId(value)};
  } else if (value instanceof Map) {
    return {sanitizedValue: new Map()};
  } else if (value instanceof Buffer) {
    // Buffers contain arbitrary data and may include secrets
    return {sanitizedValue: new Buffer("")};
  } else if (typeof value === "object") {
    const sanitizedObject = {};

    const ownPropertyNames = Object.getOwnPropertyNames(value);
    for (const key of ownPropertyNames) {
      const normalizedKey = key.toLowerCase().replaceAll(/[^a-zA-Z0-9]/g, "");
      let sanitizedValue;
      let outOfTime;

      if (sensitiveFieldPatterns.some((pattern) => pattern.test(normalizedKey))) {
        sanitizedValue = "***";
      } else {
        const {sanitizedValue: _sanitizedValue, outOfTime: _outOfTime} = _sanitize(value[key], currentDepth + 1, startTime);
        sanitizedValue = _sanitizedValue;
        outOfTime = _outOfTime;
      }

      Object.defineProperty(sanitizedObject, key, {
        value: sanitizedValue,
        enumerable: value.propertyIsEnumerable?.(key) ?? false,
      });

      if (outOfTime) {
        return {sanitizedValue: sanitizedObject, outOfTime};
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
