import { afterEach, describe, expect, it, vi } from "vitest";

describe("LibraryCommand constructor guards", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("node:fs");
    vi.doUnmock("node:fs/promises");
    vi.doUnmock("prompts");
  });

  it("creates output directory when missing", async () => {
    const mkdirSyncMock = vi.fn();

    vi.doMock("node:fs", () => ({
      Dirent: class {
        public readonly kind = "dirent";
      },
      existsSync: vi.fn(() => false),
      mkdirSync: mkdirSyncMock,
    }));

    vi.doMock("node:fs/promises", () => ({
      appendFile: vi.fn(async () => await Promise.resolve()),
      mkdir: vi.fn(async () => await Promise.resolve()),
      readdir: vi.fn(async () => await Promise.resolve([])),
    }));

    vi.doMock("prompts", () => ({
      default: vi.fn(async () => await Promise.resolve({ provider: "ALL" })),
    }));

    const { LibraryCommand } = await import("./library.command");

    const logger = {
      error: vi.fn(),
      log: vi.fn(),
      setContext: vi.fn(),
      warn: vi.fn(),
    };

    const command = new LibraryCommand(logger as never, []);

    expect(command).toBeDefined();
    expect(mkdirSyncMock).toHaveBeenCalledWith(expect.any(String), {
      recursive: true,
    });
  });

  it("skips output directory creation when it already exists", async () => {
    const mkdirSyncMock = vi.fn();

    vi.doMock("node:fs", () => ({
      Dirent: class {
        public readonly kind = "dirent";
      },
      existsSync: vi.fn(() => true),
      mkdirSync: mkdirSyncMock,
    }));

    vi.doMock("node:fs/promises", () => ({
      appendFile: vi.fn(async () => await Promise.resolve()),
      mkdir: vi.fn(async () => await Promise.resolve()),
      readdir: vi.fn(async () => await Promise.resolve([])),
    }));

    vi.doMock("prompts", () => ({
      default: vi.fn(async () => await Promise.resolve({ provider: "ALL" })),
    }));

    const { LibraryCommand } = await import("./library.command");

    const logger = {
      error: vi.fn(),
      log: vi.fn(),
      setContext: vi.fn(),
      warn: vi.fn(),
    };

    const command = new LibraryCommand(logger as never, []);

    expect(command).toBeDefined();
    expect(mkdirSyncMock).not.toHaveBeenCalled();
  });
});
