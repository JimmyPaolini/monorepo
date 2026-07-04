import { beforeEach, describe, expect, it, vi } from "vitest";

import type * as NestCommander from "nest-commander";

const { runMock, setContextMock } = vi.hoisted(() => {
  return {
    runMock: vi
      .fn<
        (
          module: unknown,
          options?: { bufferLogs?: boolean; logger?: unknown },
        ) => Promise<void>
      >()
      .mockResolvedValue(undefined),
    setContextMock: vi.fn<(context: string) => void>(),
  };
});

vi.mock("nest-commander", async (importOriginal) => {
  const actual = await importOriginal<typeof NestCommander>();
  return {
    ...actual,
    CommandFactory: {
      run: runMock,
    },
  };
});

vi.mock("./modules/logger/logger.service", () => ({
  LoggerService: class {
    setContext = setContextMock;
  },
}));

describe("main bootstrap", () => {
  beforeEach(() => {
    runMock.mockClear();
    setContextMock.mockClear();
    vi.resetModules();
  });

  it("runs command factory with buffered logger options", async () => {
    await import("./main");

    expect(setContextMock).toHaveBeenCalledWith("CommandFactory");
    expect(runMock).toHaveBeenCalledTimes(1);

    const runOptions = runMock.mock.calls[0]?.[1];

    expect(runOptions?.bufferLogs).toBe(true);
    expect(runOptions?.logger).toBeDefined();
  });
});
