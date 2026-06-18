import { beforeEach, describe, expect, it, vi } from "vitest";

import { CaelundasModule } from "./modules/caelundas/caelundas.module";

const { mockCommandFactoryRun } = vi.hoisted(() => ({
  mockCommandFactoryRun: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("nest-commander", async (importOriginal) => {
  const actual = await importOriginal<typeof import("nest-commander")>();
  return {
    ...actual,
    CommandFactory: {
      run: mockCommandFactoryRun,
    },
  };
});

describe("main", () => {
  beforeEach(() => {
    vi.resetModules();
    mockCommandFactoryRun.mockClear();
  });

  it("bootstraps the command factory with the root module", async () => {
    await import("./main");

    expect(mockCommandFactoryRun).toHaveBeenCalledTimes(1);
    expect(mockCommandFactoryRun.mock.calls[0]?.[0]?.name).toBe(
      CaelundasModule.name,
    );

    const options = mockCommandFactoryRun.mock.calls[0]?.[1] as {
      bufferLogs?: boolean;
      logger?: unknown;
    };

    expect(options?.bufferLogs).toBe(true);
    expect(options?.logger).toBeDefined();
  });
});
