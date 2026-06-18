import { describe, expect, it, vi } from "vitest";

const { mockForRoot } = vi.hoisted(() => ({
  mockForRoot: vi.fn((options: unknown) => options),
}));

vi.mock("@nestjs/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@nestjs/config")>();
  return {
    ...actual,
    ConfigModule: {
      forRoot: mockForRoot,
    },
  };
});

import { CaelundasModule } from "./caelundas.module";

describe("CaelundasModule", () => {
  it("configures the global env validator", () => {
    expect(CaelundasModule).toBeDefined();
    expect(mockForRoot).toHaveBeenCalledTimes(1);

    const options = mockForRoot.mock.calls[0]?.[0] as {
      envFilePath?: string;
      isGlobal?: boolean;
      validate?: (config: Record<string, unknown>) => unknown;
    };

    expect(options).toEqual(
      expect.objectContaining({
        envFilePath: ".env",
        isGlobal: true,
        validate: expect.any(Function),
      }),
    );
    expect(options.validate?.({})).toEqual({ OUTPUT_DIRECTORY: "./output" });
  });
});
