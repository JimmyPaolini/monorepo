import { beforeEach, describe, expect, it, vi } from "vitest";

import { CaelundasModule } from "./modules/caelundas/caelundas.module";

import type * as NestCommanderModule from "nest-commander";

const { mockCommandFactoryRun } = vi.hoisted(() => ({
  mockCommandFactoryRun: vi
    .fn<() => Promise<void>>()
    .mockResolvedValue(undefined),
}));

vi.mock("nest-commander", async (importOriginal) => {
  const actual = await importOriginal<typeof NestCommanderModule>();
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

    const firstCall = mockCommandFactoryRun.mock.calls[0] as
      | [object, object]
      | undefined;
    const module = firstCall?.[0] as undefined | { name?: string };

    expect(module?.name).toBe(CaelundasModule.name);

    const options = firstCall?.[1] as
      | undefined
      | {
          bufferLogs?: boolean;
          logger?: unknown;
        };

    if (options === undefined) throw new Error("options is undefined");

    expect(options.bufferLogs).toBe(true);
    expect(options.logger).toBeDefined();
  });
});
