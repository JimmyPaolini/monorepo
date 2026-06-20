import { afterEach, describe, expect, it, vi } from "vitest";

const replMock = vi.fn(async (): Promise<void> => {});

vi.mock("@nestjs/core", () => ({
  repl: replMock,
}));

describe("repl bootstrap", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("starts NestJS repl with ingestion module", async () => {
    await import("./repl");

    await vi.waitFor(() => {
      expect(replMock).toHaveBeenCalledTimes(1);
    });

    expect(replMock).toHaveBeenCalledWith(expect.any(Function));
  }, 15_000);
});
