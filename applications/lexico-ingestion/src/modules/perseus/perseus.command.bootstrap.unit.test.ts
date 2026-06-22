import { afterEach, describe, expect, it } from "vitest";

describe("perseusCommand constructor and logging branches", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("node:fs");
    vi.doUnmock("node:fs/promises");
  });

  it("creates output directory when constructor detects it is missing", async () => {
    const mkdirSyncMock = vi.fn<(...args: unknown[]) => void>();

    vi.doMock("node:fs", () => ({
      existsSync: vi.fn<() => boolean>(() => false),
      mkdirSync: mkdirSyncMock,
    }));

    vi.doMock("node:fs/promises", () => ({
      access: vi.fn<() => Promise<void>>(async () => await Promise.resolve()),
      appendFile: vi.fn<() => Promise<void>>(
        async () => await Promise.resolve(),
      ),
      mkdir: vi.fn<() => Promise<string | undefined>>(
        async () => await Promise.resolve(undefined),
      ),
      writeFile: vi.fn<() => Promise<void>>(
        async () => await Promise.resolve(),
      ),
    }));

    const { PerseusCommand } = await import("./perseus.command");

    const logger = {
      error: vi.fn<(...parameters: unknown[]) => void>(),
      log: vi.fn<(...parameters: unknown[]) => void>(),
      setContext: vi.fn<(context: string) => void>(),
      warn: vi.fn<(...parameters: unknown[]) => void>(),
    };

    const command = new PerseusCommand(logger as never);

    expect(command).toBeDefined();
    expect(mkdirSyncMock).toHaveBeenCalledWith(expect.any(String), {
      recursive: true,
    });
  });

  it("stringifies non-Error values in download error logging", async () => {
    const appendFileMock = vi.fn(async () => await Promise.resolve());

    vi.doMock("node:fs", () => ({
      existsSync: vi.fn<() => boolean>(() => true),
      mkdirSync: vi.fn<(...args: unknown[]) => void>(),
    }));

    vi.doMock("node:fs/promises", () => ({
      access: vi.fn<() => Promise<void>>(async () => await Promise.resolve()),
      appendFile: appendFileMock,
      mkdir: vi.fn<() => Promise<string | undefined>>(
        async () => await Promise.resolve(undefined),
      ),
      writeFile: vi.fn<() => Promise<void>>(
        async () => await Promise.resolve(),
      ),
    }));

    const { PerseusCommand } = await import("./perseus.command");

    const logger = {
      error: vi.fn<(...parameters: unknown[]) => void>(),
      log: vi.fn<(...parameters: unknown[]) => void>(),
      setContext: vi.fn<(context: string) => void>(),
      warn: vi.fn<(...parameters: unknown[]) => void>(),
    };

    const command = new PerseusCommand(logger as never);

    await (
      command as unknown as {
        appendSourceDownloadErrorLog: (
          xmlPath: string,
          error: unknown,
        ) => Promise<void>;
      }
    ).appendSourceDownloadErrorLog("a/file-lat.xml", "text failure");

    expect(logger.error).toHaveBeenCalledWith(
      "❌ Error downloading a/file-lat.xml: text failure",
    );
    expect(appendFileMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining("text failure"),
    );
  });
});
