describe("RotatingFileLogger", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const {expect} = require("chai");
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
      uniqueStreams.values().map((stream) => {
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
    expect(fs.existsSync(directory), "Expected directory to not exist").to.be.false;
  }

  function expectDirectoryContainsOneOrMoreFiles(directory) {
    const logDirectoryContents = fs.readdirSync(directory);
    expect(logDirectoryContents).to.be.an("array").that.is.not.empty;
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
      expect(fileName.endsWith(`${logName}.log`)).to.be.true;
    }
  });

  it("should write log messages to files", async () => {
    const logger = createLogger({logName, logDirectory});

    const logMessage = `Item ID: ${chance.guid()}`
    logger.info(logMessage);

    await shutdownLogging();

    const logContents = getContentsOfAllLogFiles({logName, logDirectory});
    expect(logContents).to.contain(logMessage);
  });

  it("should write log messages to different files when multiple loggers are instantiated with different file locations", async () => {
    const firstLogger = createLogger({logName: "first-logger", logDirectory});
    const secondLogger = createLogger({logName: "second-logger", logDirectory});

    firstLogger.info("Message from first logger");
    secondLogger.info("Message from second logger");

    await shutdownLogging();

    const firstLogFileContents = getContentsOfAllLogFiles({logName: "first-logger", logDirectory});
    const secondLogFileContents = getContentsOfAllLogFiles({logName: "second-logger", logDirectory});

    expect(firstLogFileContents).to.contain("Message from first logger");
    expect(firstLogFileContents).not.to.contain("Message from second logger");
    expect(secondLogFileContents).to.contain("Message from second logger");
    expect(secondLogFileContents).not.to.contain("Message from first logger");
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
      expect(logContents).to.contain(`Log message ${index}`);
    }
  });

  it("should avoid creating multiple file streams when multiple loggers are instantiated which log to the same file location", async () => {
    await shutdownLogging();

    sinon.spy(RotatingFileStream, "createStream");
    expect(RotatingFileStream.createStream.callCount).to.eql(0);

    const firstLogger = createLogger({logName, logDirectory});
    expect(RotatingFileStream.createStream.callCount).to.eql(1);

    const secondLogger = createLogger({logName, logDirectory});
    expect(RotatingFileStream.createStream.callCount).to.eql(1);
    expect(firstLogger.loggers[0]._stream).to.eql(secondLogger.loggers[0]._stream);
  });

  it("should recreate the file stream when the logger's underlying file stream is closed, then a new logger instance is created", async () => {
    await shutdownLogging();

    sinon.spy(RotatingFileStream, "createStream");
    expect(RotatingFileStream.createStream.callCount).to.eql(0);

    const firstLogger = createLogger({logName, logDirectory});
    expect(RotatingFileStream.createStream.callCount).to.eql(1);

    await shutdownLogging();

    const secondLogger = createLogger({logName, logDirectory});
    expect(RotatingFileStream.createStream.callCount).to.eql(2);
    expect(firstLogger.loggers[0]._stream).not.to.eql(secondLogger.loggers[0]._stream);
  });

  it("should continue writing log messages after the logger's underlying file stream is closed, then a new logger instance is created", async () => {
    const firstLogger = createLogger({logName, logDirectory});
    firstLogger.info("Message from first logger");

    await shutdownLogging();

    let logContents = getContentsOfAllLogFiles({logName, logDirectory});
    expect(logContents).to.contain("Message from first logger");

    const secondLogger = createLogger({logName, logDirectory});
    secondLogger.info("Message from second logger");

    await shutdownLogging();

    logContents = getContentsOfAllLogFiles({logName, logDirectory});
    expect(logContents).to.contain("Message from second logger");
  });
});
