import { afterEach, describe, expect, it, vi } from "vitest";

describe("LoggerService environment initialization", () => {
  const originalNodeEnvironment = process.env["NODE_ENV"];

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

    const { LoggerService } = await import("./logger.service");
    const loggerService = new LoggerService();

    expect(() => {
      loggerService.setContext("ProductionTestContext");
      loggerService.log("production message");
    }).not.toThrow();
  });

  it("initializes logger in development mode", async () => {
    process.env["NODE_ENV"] = "development";
    vi.resetModules();

    const { LoggerService } = await import("./logger.service");
    const loggerService = new LoggerService();

    expect(() => {
      loggerService.setContext("DevelopmentTestContext");
      loggerService.log("development message");
    }).not.toThrow();
  });
});
