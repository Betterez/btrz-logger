const {expect} = require("chai");
const sinon = require("sinon");
const sandbox = sinon.createSandbox();
const logentries = require("node-logentries");
const {LogEntriesLogger} = require("../src/log-entries-logger");


describe("LogEntriesLogger", () => {

  afterEach(() => {
    sandbox.restore();
  });

  describe("constructor", () => {
    it("should throw an error if no api token is provided", () => {
      function sut() {
        return new LogEntriesLogger({});
      }

      expect(sut).to.throw("a token is required to connect to logentries");
    });
  });
});
