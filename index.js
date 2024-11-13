function monkeyPatchMongoObjectID() {
  // "bson" is not listed in our package.json dependencies, but is instead indirectly imported by "mongodb".
  // We do this because we want to use whatever version of "bson" is used by the "mongodb" package.  We are trying
  // to target the same version of "mongodb" that is used by "btrz-simple-dao".
  const {ObjectId} = require("bson");

  // The 'bson' library at version 1.1.6 specifies a custom function to format an ObjectId when it is being inspected
  // with 'util.inspect'. It is buggy and causes an error to be thrown.  We replace the custom inspect function in
  // the ObjectId prototype so that we do not encounter this bug.
  // See https://github.com/mongodb/js-bson/blob/6fc7a87d64369cdb64719f0de944d6aa3c70ee75/lib/bson/objectid.js#L207
  delete ObjectId.prototype[Symbol.for('nodejs.util.inspect.custom')];
  delete ObjectId.prototype.inspect;

  // From "bson" source code. Precomputed hex table enables speedy hex string conversion
  const hexTable = [];
  for (let i = 0; i < 256; i++) {
    hexTable[i] = (i <= 15 ? '0' : '') + i.toString(16);
  }

  ObjectId.prototype[Symbol.for("nodejs.util.inspect.custom")] = function inspect() {
    let hexString = "";

    if (this.id instanceof Buffer) {
      for (let i = 0; i < 12; i++) {
        hexString += hexTable[this.id[i]];
      }
    } else {
      for (var i = 0; i < this.id.length; i++) {
        hexString += hexTable[this.id.charCodeAt(i)];
      }
    }

    return `new ObjectId(${hexString})`
  };
}

monkeyPatchMongoObjectID();

exports.LoggerFactory = require("./src/logger-factory").LoggerFactory;
exports.Logger = require("./src/logger").Logger;
exports.LoggerForTests = require("./src/logger-for-tests").LoggerForTests;
exports.ConsoleLogger = require("./src/console-logger").ConsoleLogger;
exports.LogEntriesLogger = require("./src/log-entries-logger").LogEntriesLogger;
exports.SilentLogger = require("./src/silent-logger").SilentLogger;
exports.expressMiddleware = require("./src/express-middleware").expressMiddleware;
exports.constants = require("./constants");
