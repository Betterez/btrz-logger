"use strict";

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

function cleanArgs(args) {
  const creditCardRegx = `(?:4[0-9]{12}(?:[0-9]{3})?|(?:5[1-5][0-9]{2}|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\\d{3})\\d{11}|6(?:011|5[0-9]{2})[0-9]{12})`
  const emailRegx = `(?:4[0-9]{12}(?:[0-9]{3})?|(?:5[1-5][0-9]{2}|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\\d{3})\\d{11}|6(?:011|5[0-9]{2})[0-9]{12})`
  let _args = [];
  
  if (!Array.isArray(args)) {
    return args;
  }
  
  try {
    _args = args.map((arg)=> {
      let newBuf = arg;
      newBuf = newBuf.replace(/\b[\w\.-]+@[\w\.-]+\.\w{2,4}\b/g, "regx.email.replaced");
      newBuf = newBuf.replace(new RegExp(creditCardRegx, "gm"), "regx.ccnumber.replaced");
      return newBuf;
    })
  } catch (e) {
    // ignore errors
  }
  return _args;
}

module.exports = { cleanUrlRawParameters, cleanArgs }
