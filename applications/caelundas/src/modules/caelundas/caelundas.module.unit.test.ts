import { describe, expect, it } from "vitest";
const { mockForRoot } = vi.hoisted(() => ({
  mockForRoot: vi.fn<(options: unknown) => unknown>(
    (options: unknown) => options,
  ),
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

describe(CaelundasModule, () => {
  it("configures the global env validator", () => {
    expect(CaelundasModule).toBeDefined();
    expect(mockForRoot).toHaveBeenCalledTimes(1);

    const firstCall = mockForRoot.mock.calls[0] as
      | [
          {
            envFilePath?: string;
            isGlobal?: boolean;
            validate?: (config: Record<string, unknown>) => unknown;
          },
        ]
      | undefined;
    const options = firstCall?.[0];

    if (options === undefined) throw new Error("options is undefined");

    expect(options.envFilePath).toBe(".env");
    expect(options.isGlobal).toBe(true);
    expect(typeof options.validate).toBe("function");
    expect(options.validate?.({})).toStrictEqual({
      OUTPUT_DIRECTORY: "./output",
    });
  });
});
