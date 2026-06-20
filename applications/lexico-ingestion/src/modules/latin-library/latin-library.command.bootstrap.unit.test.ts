import { afterEach, describe, expect, it, vi } from "vitest";

import type { LoggerService } from "../logger/logger.service";

describe("LatinLibraryCommand constructor bootstrap", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("node:fs");
  });

  it("creates the output directory when it does not exist", async () => {
    const existsSync = vi.fn(() => false);
    const mkdirSync = vi.fn();

    vi.doMock("node:fs", () => ({
      existsSync,
      mkdirSync,
    }));

    const { LatinLibraryCommand } = await import("./latin-library.command");

    const logger = {
      error: vi.fn(),
      log: vi.fn(),
      setContext: vi.fn(),
      warn: vi.fn(),
    };

    const command = new LatinLibraryCommand(logger as unknown as LoggerService);

    expect(command).toBeDefined();
    expect(existsSync).toHaveBeenCalledTimes(1);
    expect(mkdirSync).toHaveBeenCalledWith(expect.any(String), {
      recursive: true,
    });
  });
});
