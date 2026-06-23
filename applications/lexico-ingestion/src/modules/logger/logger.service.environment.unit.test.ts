import { afterEach, describe, expect, it } from "vitest";

describe("logger environment initialization", () => {
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
    const logger = new LoggerService();

    expect(() => {
      logger.setContext("ProductionTestContext");
      logger.log("production message");
    }).not.toThrow();
  });

  it("initializes logger in development mode", async () => {
    process.env["NODE_ENV"] = "development";
    vi.resetModules();

    const { LoggerService } = await import("./logger.service");
    const logger = new LoggerService();

    expect(() => {
      logger.setContext("DevelopmentTestContext");
      logger.log("development message");
    }).not.toThrow();
  });
});
