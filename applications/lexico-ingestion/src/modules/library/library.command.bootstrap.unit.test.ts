import { afterEach, describe, expect, it } from "vitest";

describe("libraryCommand constructor guards", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("node:fs");
    vi.doUnmock("node:fs/promises");
    vi.doUnmock("prompts");
  });

  it("creates output directory when missing", async () => {
    const mkdirSyncMock = vi.fn<() => void>();

    vi.doMock("node:fs", () => ({
      Dirent: class {
        public readonly kind = "dirent";
      },
      existsSync: vi.fn<() => boolean>(() => false),
      mkdirSync: mkdirSyncMock,
    }));

    vi.doMock("node:fs/promises", () => ({
      appendFile: vi.fn<() => Promise<void>>(
        async () => await Promise.resolve(),
      ),
      mkdir: vi.fn<() => Promise<void>>(async () => await Promise.resolve()),
      readdir: vi.fn<() => Promise<string[]>>(
        async () => await Promise.resolve([]),
      ),
    }));

    vi.doMock("prompts", () => ({
      default: vi.fn<() => Promise<{ provider: string }>>(
        async () => await Promise.resolve({ provider: "ALL" }),
      ),
    }));

    const { LibraryCommand } = await import("./library.command");

    const logger = {
      error: vi.fn<(...parameters: unknown[]) => void>(),
      log: vi.fn<(...parameters: unknown[]) => void>(),
      setContext: vi.fn<(context: string) => void>(),
      warn: vi.fn<(...parameters: unknown[]) => void>(),
    };

    const command = new LibraryCommand(logger as never, []);

    expect(command).toBeDefined();
    expect(mkdirSyncMock).toHaveBeenCalledWith(expect.any(String), {
      recursive: true,
    });
  });

  it("skips output directory creation when it already exists", async () => {
    const mkdirSyncMock = vi.fn<(...parameters: unknown[]) => void>();

    vi.doMock("node:fs", () => ({
      Dirent: class {
        public readonly kind = "dirent";
      },
      existsSync: vi.fn<() => boolean>(() => true),
      mkdirSync: mkdirSyncMock,
    }));

    vi.doMock("node:fs/promises", () => ({
      appendFile: vi.fn<() => Promise<void>>(
        async () => await Promise.resolve(),
      ),
      mkdir: vi.fn<() => Promise<void>>(async () => await Promise.resolve()),
      readdir: vi.fn<() => Promise<string[]>>(
        async () => await Promise.resolve([]),
      ),
    }));

    vi.doMock("prompts", () => ({
      default: vi.fn<() => Promise<{ provider: string }>>(
        async () => await Promise.resolve({ provider: "ALL" }),
      ),
    }));

    const { LibraryCommand } = await import("./library.command");

    const logger = {
      error: vi.fn<(...parameters: unknown[]) => void>(),
      log: vi.fn<(...parameters: unknown[]) => void>(),
      setContext: vi.fn<(context: string) => void>(),
      warn: vi.fn<(...parameters: unknown[]) => void>(),
    };

    const command = new LibraryCommand(logger as never, []);

    expect(command).toBeDefined();
    expect(mkdirSyncMock).not.toHaveBeenCalled();
  });
});
