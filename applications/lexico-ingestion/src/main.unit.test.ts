import { CommandFactory } from "nest-commander";
import { afterEach, describe, expect, it } from "vitest";

const setContextMock = vi.fn<(context: string) => void>();
const loggerConstructorMock = vi.fn<() => void>();

vi.mock("./modules/logger/logger.service", () => ({
  LoggerService: class MockLoggerService {
    constructor() {
      loggerConstructorMock();
    }

    setContext = setContextMock;
  },
}));

describe("main bootstrap", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("boots command factory with buffered logs", async () => {
    const runSpy = vi.spyOn(CommandFactory, "run").mockResolvedValue(undefined);

    await import("./main");

    await vi.waitFor(() => {
      expect(runSpy).toHaveBeenCalledTimes(1);
    });

    expect(loggerConstructorMock).toHaveBeenCalledTimes(1);
    expect(setContextMock).toHaveBeenCalledWith("CommandFactory");

    expect(runSpy).toHaveBeenCalledWith(
      expect.any(Function),
      expect.anything(),
    );
  }, 15_000);
});
