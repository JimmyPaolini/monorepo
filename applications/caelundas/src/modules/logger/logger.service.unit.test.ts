import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { LoggerService } from "./logger.service";

describe(LoggerService, () => {
  let service: LoggerService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [LoggerService],
    }).compile();

    service = await module.resolve(LoggerService);
  });

  it("is defined", () => {
    expect(service).toBeDefined();
  });

  it("routes log levels through the scoped child logger", () => {
    type ChildLogger = {
      debug: (...args: unknown[]) => void;
      error: (...args: unknown[]) => void;
      info: (...args: unknown[]) => void;
      trace: (...args: unknown[]) => void;
      warn: (...args: unknown[]) => void;
    };

    const childLogger = service as unknown as {
      child: ChildLogger;
      context: string;
    };

    const debugSpy = vi.spyOn(childLogger.child, "debug");
    const errorSpy = vi.spyOn(childLogger.child, "error");
    const infoSpy = vi.spyOn(childLogger.child, "info");
    const traceSpy = vi.spyOn(childLogger.child, "trace");
    const warnSpy = vi.spyOn(childLogger.child, "warn");

    service.setContext("LoggerServiceTest");
    service.debug("debug message");
    service.error("error message", "stack");
    service.log("info message");
    service.verbose("trace message");
    service.warn("warn message");

    expect(childLogger.context).toBe("LoggerServiceTest");
    expect(debugSpy).toHaveBeenCalledWith(
      { context: "LoggerServiceTest" },
      "debug message",
    );
    expect(errorSpy).toHaveBeenCalledWith(
      { context: "LoggerServiceTest", stack: "stack" },
      "error message",
    );
    expect(infoSpy).toHaveBeenCalledWith(
      { context: "LoggerServiceTest" },
      "info message",
    );
    expect(traceSpy).toHaveBeenCalledWith(
      { context: "LoggerServiceTest" },
      "trace message",
    );
    expect(warnSpy).toHaveBeenCalledWith(
      { context: "LoggerServiceTest" },
      "warn message",
    );
  });
});
