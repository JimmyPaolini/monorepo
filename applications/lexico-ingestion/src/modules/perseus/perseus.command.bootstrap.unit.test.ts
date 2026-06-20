import { afterEach, describe, expect, it, vi } from "vitest";

describe("PerseusCommand constructor and logging branches", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("node:fs");
    vi.doUnmock("node:fs/promises");
  });

  it("creates output directory when constructor detects it is missing", async () => {
    const mkdirSyncMock = vi.fn();

    vi.doMock("node:fs", () => ({
      existsSync: vi.fn(() => false),
      mkdirSync: mkdirSyncMock,
    }));

    vi.doMock("node:fs/promises", () => ({
      access: vi.fn(async () => await Promise.resolve()),
      appendFile: vi.fn(async () => await Promise.resolve()),
      mkdir: vi.fn(async () => await Promise.resolve()),
      writeFile: vi.fn(async () => await Promise.resolve()),
    }));

    const { PerseusCommand } = await import("./perseus.command");

    const logger = {
      error: vi.fn(),
      log: vi.fn(),
      setContext: vi.fn(),
      warn: vi.fn(),
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
      existsSync: vi.fn(() => true),
      mkdirSync: vi.fn(),
    }));

    vi.doMock("node:fs/promises", () => ({
      access: vi.fn(async () => await Promise.resolve()),
      appendFile: appendFileMock,
      mkdir: vi.fn(async () => await Promise.resolve()),
      writeFile: vi.fn(async () => await Promise.resolve()),
    }));

    const { PerseusCommand } = await import("./perseus.command");

    const logger = {
      error: vi.fn(),
      log: vi.fn(),
      setContext: vi.fn(),
      warn: vi.fn(),
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
