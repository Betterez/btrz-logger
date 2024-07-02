const MAX_DEPTH = 15;
const MAX_LOG_BODY_LENGTH = 4096;
const creditCardRegx = `(?:4[0-9]{12}(?:[0-9]{3})?|(?:5[1-5][0-9]{2}|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\\d{3})\\d{11}|6(?:011|5[0-9]{2})[0-9]{12})`;
const emailRegx = `(?:4[0-9]{12}(?:[0-9]{3})?|(?:5[1-5][0-9]{2}|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\\d{3})\\d{11}|6(?:011|5[0-9]{2})[0-9]{12})`;
const flaggedFields = ["email", "mail", "password", "ccnumber", "ccard", "credentials", "user", "firstName", "lastName", "address", "phone", "didyoumean", "createdByUserEmail", "updatedByUserEmail"];

function cleanUrlRawParameters(buf) {
  let newBuf = buf;
  try {
    newBuf = decodeURIComponent(buf);
  } catch (e) {
    // ignore decoding errors and proceed with original data
  }

  newBuf = newBuf.replace(/\[firstName\]=[^\&\"]*/g, "[firstName]=***");
  newBuf = newBuf.replace(/\[lastName\]=[^\&\"]*/g, "[lastName]=***");
  newBuf = newBuf.replace(/\[email\]=\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b/g, "[email]=***@***.***");
  return newBuf;
}

/**
 * @param {AxiosError} error
 */
function cleanAxiosError(error) {
  const {method, baseURL, url} = /** @type {InternalAxiosRequestConfig} */ error.config;
  let errorStr = `[${error.code}] Request failed`;
  let responseData = "";

  if (error.response) {
    const {status, data} = error.response;
    errorStr = `${errorStr} with status ${status}`;
    if (typeof data === "string") {
      responseData = cleanStringValue(data);
    } else {
      try {
        const cleanResponse = JSON.stringify(clearArg(data, 1));
        responseData = cleanResponse.substring(0, MAX_LOG_BODY_LENGTH);
      } catch (e) {
        // Ignore error
      }
    }
  }

  errorStr = `${errorStr}: [${method.toUpperCase()}] ${baseURL}${!baseURL.endsWith("/") && !url.startsWith("/") ? "/" : ""}${url}`;

  return responseData ? `${errorStr}\n${responseData}` : errorStr;
}

function cleanStringValue(value) {
  let newBuf = value;
  if (newBuf.length > MAX_LOG_BODY_LENGTH) {
    newBuf = newBuf.substring(0, MAX_LOG_BODY_LENGTH) + " [TRUNCATED]";
  }

  try {
    newBuf = newBuf.replace(/\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b/g, "regx.email.replaced");
    newBuf = newBuf.replace(new RegExp(creditCardRegx, "gm"), "regx.ccnumber.replaced");
    return newBuf;
  } catch (_e) {
    return value;
  }
}

function clearArg(arg, depth = 0) {
  if (depth > MAX_DEPTH) {
    return arg;
  }
  if (typeof arg === "string") {
    return cleanStringValue(arg)
  }
  if (Array.isArray(arg)) {
    return arg.map((argItem) => {
      return clearArg(argItem, depth + 1);
    })
  }
  if (typeof arg === "object") {
    if (arg.constructor && arg.constructor.name === "AxiosError") {
      return cleanAxiosError(arg);
    }
    const newBuf = arg;
    Object.keys(newBuf).forEach((key) => {
      const baseKey = key.toLowerCase().replaceAll("_", "");
      if (flaggedFields.includes(baseKey)) {
        newBuf[key] = "***";
      } else {
        newBuf[key] = clearArg(newBuf[key], depth + 1)
      }
    })
  }
  return arg;
}

function cleanArgs(args) {
  let _args = [];

  if (!Array.isArray(args)) {
    return args;
  }

  try {
    _args = args.map((arg)=> {
      return clearArg(arg,  0);
    })
  } catch (e) {
    // ignore errors
  }
  return _args;
}

module.exports = { cleanUrlRawParameters, cleanArgs }
