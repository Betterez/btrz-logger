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

module.exports = { cleanUrlRawParameters }
