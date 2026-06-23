import { Test } from "@nestjs/testing";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { LoggerService } from "./logger.service";

describe(LoggerService, () => {
  const originalNodeEnvironment = process.env["NODE_ENV"];

  interface LoggerChildMock {
    debug: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    trace: ReturnType<typeof vi.fn>;
    warn: ReturnType<typeof vi.fn>;
  }

  let service: LoggerService;

  const createLoggerChildMock = (): LoggerChildMock => ({
    debug: vi.fn<(...parameters: unknown[]) => void>(),
    error: vi.fn<(...parameters: unknown[]) => void>(),
    info: vi.fn<(...parameters: unknown[]) => void>(),
    trace: vi.fn<(...parameters: unknown[]) => void>(),
    warn: vi.fn<(...parameters: unknown[]) => void>(),
  });

  const setLoggerChildMock = (loggerChildMock: LoggerChildMock): void => {
    (service as unknown as { child: LoggerChildMock }).child = loggerChildMock;
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [LoggerService],
    }).compile();

    service = await module.resolve(LoggerService);
  });

  describe("environment initialization", () => {
    afterEach(() => {
      if (originalNodeEnvironment === undefined) {
        delete process.env["NODE_ENV"];
      } else {
        process.env["NODE_ENV"] = originalNodeEnvironment;
      }
      vi.resetModules();
    });

    it("initializes logger in production mode", async () => {
      process.env["NODE_ENV"] = "production";
      vi.resetModules();

      const { LoggerService: LoggerServiceForEnvironment } =
        await import("./logger.service");
      const logger = new LoggerServiceForEnvironment();

      expect(() => {
        logger.setContext("ProductionTestContext");
        logger.log("production message");
      }).not.toThrow();
    });

    it("initializes logger in development mode", async () => {
      process.env["NODE_ENV"] = "development";
      vi.resetModules();

      const { LoggerService: LoggerServiceForEnvironment } =
        await import("./logger.service");
      const logger = new LoggerServiceForEnvironment();

      expect(() => {
        logger.setContext("DevelopmentTestContext");
        logger.log("development message");
      }).not.toThrow();
    });
  });

  it("is defined", () => {
    expect(service).toBeDefined();
  });

  describe("setContext", () => {
    it("should apply context to subsequent log calls", () => {
      const loggerChildMock = createLoggerChildMock();

      service.setContext("TestService");
      setLoggerChildMock(loggerChildMock);
      service.log("message");

      expect(loggerChildMock.info).toHaveBeenCalledWith(
        { context: "TestService" },
        "message",
      );
    });
  });

  describe("log", () => {
    it("should log message with current context", () => {
      const loggerChildMock = createLoggerChildMock();

      service.setContext("TestContext");
      setLoggerChildMock(loggerChildMock);
      const message = "Test message";

      service.log(message);

      expect(loggerChildMock.info).toHaveBeenCalledWith(
        { context: "TestContext" },
        "Test message",
      );
    });

    it("should stringify non-string messages", () => {
      const loggerChildMock = createLoggerChildMock();

      service.setContext("TestContext");
      setLoggerChildMock(loggerChildMock);
      const message = { data: "test" };

      service.log(message);

      expect(loggerChildMock.info).toHaveBeenCalledWith(
        { context: "TestContext" },
        "[object Object]",
      );
    });

    it("should prefer provided context over instance context", () => {
      const loggerChildMock = createLoggerChildMock();

      service.setContext("InstanceContext");
      setLoggerChildMock(loggerChildMock);
      const message = "Test";
      const customContext = "CustomContext";

      service.log(message, customContext);

      expect(loggerChildMock.info).toHaveBeenCalledWith(
        { context: "CustomContext" },
        "Test",
      );
    });
  });

  describe("debug", () => {
    it("should log debug messages with current context", () => {
      const loggerChildMock = createLoggerChildMock();

      service.setContext("TestContext");
      setLoggerChildMock(loggerChildMock);
      const message = "Debug message";

      service.debug(message);

      expect(loggerChildMock.debug).toHaveBeenCalledWith(
        { context: "TestContext" },
        "Debug message",
      );
    });
  });

  describe("warn", () => {
    it("should log warning messages with current context", () => {
      const loggerChildMock = createLoggerChildMock();

      service.setContext("TestContext");
      setLoggerChildMock(loggerChildMock);
      const message = "Warning message";

      service.warn(message);

      expect(loggerChildMock.warn).toHaveBeenCalledWith(
        { context: "TestContext" },
        "Warning message",
      );
    });
  });

  describe("error", () => {
    it("should log error messages with optional stack trace", () => {
      const loggerChildMock = createLoggerChildMock();

      service.setContext("TestContext");
      setLoggerChildMock(loggerChildMock);
      const message = "Error message";
      const stack = "Error: test stack trace";

      service.error(message, stack);

      expect(loggerChildMock.error).toHaveBeenCalledWith(
        { context: "TestContext", stack },
        "Error message",
      );
    });

    it("should log error without stack trace", () => {
      const loggerChildMock = createLoggerChildMock();

      service.setContext("ErrorContext");
      setLoggerChildMock(loggerChildMock);
      const message = "An error";

      service.error(message);

      expect(loggerChildMock.error).toHaveBeenCalledWith(
        { context: "ErrorContext", stack: undefined },
        "An error",
      );
    });
  });

  describe("verbose", () => {
    it("should log verbose messages at trace level", () => {
      const loggerChildMock = createLoggerChildMock();

      service.setContext("TestContext");
      setLoggerChildMock(loggerChildMock);
      const message = "Verbose message";

      service.verbose(message);

      expect(loggerChildMock.trace).toHaveBeenCalledWith(
        { context: "TestContext" },
        "Verbose message",
      );
    });
  });
});
