import { createMock, type DeepMocked } from "@golevelup/ts-vitest";
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

    const logger: DeepMocked<LoggerService> = createMock<LoggerService>();

    const command = new LatinLibraryCommand(logger);

    expect(command).toBeDefined();
    expect(existsSync).toHaveBeenCalledTimes(1);
    expect(mkdirSync).toHaveBeenCalledWith(expect.any(String), {
      recursive: true,
    });
  });
});
