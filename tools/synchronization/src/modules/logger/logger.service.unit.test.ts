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

  it("logs using all supported levels", () => {
    expect(() => {
      service.setContext("LoggerServiceUnitTest");

      service.debug("debug-message");
      service.debug("debug-message", "custom-context");
      service.log("info-message");
      service.log("info-message", "custom-context");
      service.warn("warn-message");
      service.warn("warn-message", "custom-context");
      service.verbose("verbose-message");
      service.verbose("verbose-message", "custom-context");
      service.error("error-message");
      service.error("error-message", "stack-trace");
    }).not.toThrow();
  });
});
