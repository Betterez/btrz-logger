const assert = require("node:assert/strict");
const {describe, it, beforeEach, afterEach} = require("node:test");

describe("RotatingFileLogger", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const Chance = require("chance");
  const chance = new Chance();
  const RotatingFileStream = require("rotating-file-stream");
  const sinon = require("sinon");
  const {Logger, RotatingFileLogger} = require("../index");

  const logDirectory = path.join(__dirname, "logs");
  const logName = "tests";

  let allCreatedLoggers;

  beforeEach(() => {
    fs.rmSync(logDirectory, {recursive: true, force: true});
    allCreatedLoggers = [];
  });

  afterEach(async () => {
    await shutdownLogging();
    fs.rmSync(logDirectory, {recursive: true, force: true});
    sinon.restore();
  });

  function createLogger({logName, logDirectory}) {
    const _logger = new Logger()
      .addLogger(
        new RotatingFileLogger({
          logName,
          logDirectory,
          sanitize: false,
          addNewlines: true,
          colorize: false
        })
      );

    allCreatedLoggers.push(_logger);
    return _logger;
  }

  async function shutdownLogging() {
    const allStreams = allCreatedLoggers
      .flatMap((logger) => logger.loggers)
      .map((rotatingFileLogger) => rotatingFileLogger._stream);
    const uniqueStreams = new Set(allStreams);

    await Promise.all(
      Array.from(uniqueStreams.values()).map((stream) => {
        return new Promise((resolve) => {
          if (stream.closed) {
            return resolve();
          }

          stream.end();
          stream.on("close", resolve);
        });
      })
    );
  }

  function expectDirectoryDoesNotExist(directory) {
    assert.strictEqual(fs.existsSync(directory), false, "Expected directory to not exist");
  }

  function expectDirectoryContainsOneOrMoreFiles(directory) {
    const logDirectoryContents = fs.readdirSync(directory);
    assert.ok(Array.isArray(logDirectoryContents));
    assert.notStrictEqual(logDirectoryContents.length, 0);
  }

  function getContentsOfAllLogFiles({logName, logDirectory}) {
    const logFileNames = fs.readdirSync(logDirectory);
    const logContents = logFileNames
      .filter((fileName) => fileName.endsWith(`${logName}.log`))
      .map((fileName) => {
        const filePath = path.join(logDirectory, fileName);
        return fs.readFileSync(filePath, "utf8");
      })
      .join("\n");

    return logContents;
  }

  it("should write logs to the correct directory and file names", async () => {
    expectDirectoryDoesNotExist(logDirectory);

    const logger = createLogger({logName, logDirectory});
    logger.info("Some message");

    await shutdownLogging();
    expectDirectoryContainsOneOrMoreFiles(logDirectory);

    const logFileNames = fs.readdirSync(logDirectory);
    for (const fileName of logFileNames) {
      assert.strictEqual(fileName.endsWith(`${logName}.log`), true);
    }
  });

  it("should write log messages to files", async () => {
    const logger = createLogger({logName, logDirectory});

    const logMessage = `Item ID: ${chance.guid()}`
    logger.info(logMessage);

    await shutdownLogging();

    const logContents = getContentsOfAllLogFiles({logName, logDirectory});
    assert.ok(logContents.includes(logMessage));
  });

  it("should write log messages to different files when multiple loggers are instantiated with different file locations", async () => {
    const firstLogger = createLogger({logName: "first-logger", logDirectory});
    const secondLogger = createLogger({logName: "second-logger", logDirectory});

    firstLogger.info("Message from first logger");
    secondLogger.info("Message from second logger");

    await shutdownLogging();

    const firstLogFileContents = getContentsOfAllLogFiles({logName: "first-logger", logDirectory});
    const secondLogFileContents = getContentsOfAllLogFiles({logName: "second-logger", logDirectory});

    assert.ok(firstLogFileContents.includes("Message from first logger"));
    assert.ok(!firstLogFileContents.includes("Message from second logger"));
    assert.ok(secondLogFileContents.includes("Message from second logger"));
    assert.ok(!secondLogFileContents.includes("Message from first logger"));
  });

  it("should not drop any log messages when multiple loggers are instantiated which log to the same file location", async () => {
    const loggers = [];

    for (let i = 0; i < 100; i++) {
      loggers.push(createLogger({logName, logDirectory}));
    }

    chance.shuffle(loggers).forEach((logger, index) => {
      logger.info(`Log message ${index}`);
    });

    await shutdownLogging();

    const logContents = getContentsOfAllLogFiles({logName, logDirectory});

    for (let index = 0; index < loggers.length; index++) {
      assert.ok(logContents.includes(`Log message ${index}`));
    }
  });

  it("should avoid creating multiple file streams when multiple loggers are instantiated which log to the same file location", async () => {
    await shutdownLogging();

    sinon.spy(RotatingFileStream, "createStream");
    assert.strictEqual(RotatingFileStream.createStream.callCount, 0);

    const firstLogger = createLogger({logName, logDirectory});
    assert.strictEqual(RotatingFileStream.createStream.callCount, 1);

    const secondLogger = createLogger({logName, logDirectory});
    assert.strictEqual(RotatingFileStream.createStream.callCount, 1);
    assert.strictEqual(firstLogger.loggers[0]._stream, secondLogger.loggers[0]._stream);
  });

  it("should recreate the file stream when the logger's underlying file stream is closed, then a new logger instance is created", async () => {
    await shutdownLogging();

    sinon.spy(RotatingFileStream, "createStream");
    assert.strictEqual(RotatingFileStream.createStream.callCount, 0);

    const firstLogger = createLogger({logName, logDirectory});
    assert.strictEqual(RotatingFileStream.createStream.callCount, 1);

    await shutdownLogging();

    const secondLogger = createLogger({logName, logDirectory});
    assert.strictEqual(RotatingFileStream.createStream.callCount, 2);
    assert.notStrictEqual(firstLogger.loggers[0]._stream, secondLogger.loggers[0]._stream);
  });

  it("should continue writing log messages after the logger's underlying file stream is closed, then a new logger instance is created", async () => {
    const firstLogger = createLogger({logName, logDirectory});
    firstLogger.info("Message from first logger");

    await shutdownLogging();

    let logContents = getContentsOfAllLogFiles({logName, logDirectory});
    assert.ok(logContents.includes("Message from first logger"));

    const secondLogger = createLogger({logName, logDirectory});
    secondLogger.info("Message from second logger");

    await shutdownLogging();

    logContents = getContentsOfAllLogFiles({logName, logDirectory});
    assert.ok(logContents.includes("Message from second logger"));
  });
});
