import { beforeEach, describe, expect, it, vi } from "vitest";

type CommandFactoryRun = (
  module: unknown,
  options: { bufferLogs: boolean; logger: unknown },
) => Promise<void>;

const run = vi.fn<CommandFactoryRun>().mockResolvedValue(undefined);
const setContext = vi.fn<(context: string) => void>();

vi.mock("nest-commander", () => ({
  CommandFactory: {
    run,
  },
}));

vi.mock("./modules/logger/logger.service", () => ({
  LoggerService: class {
    setContext = setContext;
  },
}));

vi.mock("./modules/synchronization/synchronization.module", () => ({
  SynchronizationModule: class {
    readonly moduleName = "SynchronizationModuleMock";
  },
}));

describe("main bootstrap", () => {
  beforeEach(() => {
    run.mockClear();
    setContext.mockClear();
    vi.resetModules();
  });

  it("runs the synchronization command factory with a configured logger", async () => {
    await import("./main");

    expect(setContext).toHaveBeenCalledWith("CommandFactory");
    expect(run).toHaveBeenCalledTimes(1);

    const firstCall = run.mock.calls[0];

    expect(firstCall).toBeDefined();
    expect(firstCall?.[1]).toStrictEqual(
      expect.objectContaining({ bufferLogs: true }),
    );
  });
});
