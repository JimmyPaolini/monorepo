import { afterEach, describe, expect, it, vi } from "vitest";

describe("loggerService static initialization", () => {
  const originalNodeEnvironment = process.env["NODE_ENV"];
  const originalLogLevel = process.env["LOG_LEVEL"];

  afterEach(() => {
    process.env["NODE_ENV"] = originalNodeEnvironment;
    process.env["LOG_LEVEL"] = originalLogLevel;
    vi.resetModules();
  });

  it("uses production mode with explicit log level", async () => {
    process.env["NODE_ENV"] = "production";
    process.env["LOG_LEVEL"] = "debug";

    const importedModule = await import("./logger.service");
    const importedLoggerService = importedModule.LoggerService as unknown as {
      isProduction: boolean;
      root: unknown;
    };

    expect(importedLoggerService.isProduction).toBe(true);
    expect(importedLoggerService.root).toBeDefined();
  });

  it("uses production mode with default log level fallback", async () => {
    process.env["NODE_ENV"] = "production";
    delete process.env["LOG_LEVEL"];

    const importedModule = await import("./logger.service");
    const importedLoggerService = importedModule.LoggerService as unknown as {
      isProduction: boolean;
      root: unknown;
    };

    expect(importedLoggerService.isProduction).toBe(true);
    expect(importedLoggerService.root).toBeDefined();
  });
});
