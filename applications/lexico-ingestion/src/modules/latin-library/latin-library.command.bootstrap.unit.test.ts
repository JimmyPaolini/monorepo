import { afterEach, describe, expect, it } from "vitest";

import type { LoggerService } from "../logger/logger.service";

describe("latinLibraryCommand constructor bootstrap", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("node:fs");
  });

  it("creates the output directory when it does not exist", async () => {
    const existsSync = vi.fn<() => boolean>(() => false);
    const mkdirSync = vi.fn<() => void>();

    vi.doMock("node:fs", () => ({
      existsSync,
      mkdirSync,
    }));

    const { LatinLibraryCommand } = await import("./latin-library.command");

    const logger = {
      error: vi.fn<(...parameters: unknown[]) => void>(),
      log: vi.fn<(...parameters: unknown[]) => void>(),
      setContext: vi.fn<(context: string) => void>(),
      warn: vi.fn<(...parameters: unknown[]) => void>(),
    };

    const command = new LatinLibraryCommand(logger as unknown as LoggerService);

    expect(command).toBeDefined();
    expect(existsSync).toHaveBeenCalledTimes(1);
    expect(mkdirSync).toHaveBeenCalledWith(expect.any(String), {
      recursive: true,
    });
  });
});
