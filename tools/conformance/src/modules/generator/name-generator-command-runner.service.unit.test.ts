import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createWorkspaceTree,
  type GeneratorInvocationArguments,
} from "../../utilities";

import { GeneratorService } from "./generator.service";
import { NameGeneratorCommandRunner } from "./name-generator-command-runner.service";

interface LoggerLike {
  log: (message: string) => void;
}

interface NameGeneratorOptions {
  name?: string;
}

class TestNameGeneratorCommandRunner extends NameGeneratorCommandRunner<NameGeneratorOptions> {
  constructor(logger: LoggerLike) {
    super(logger);
  }

  protected readonly successMessage = "Generated test resource.";

  capturedArguments:
    | GeneratorInvocationArguments<NameGeneratorOptions>
    | undefined;

  protected override async generate(
    argumentsOrTree: GeneratorInvocationArguments<NameGeneratorOptions>,
  ): Promise<undefined> {
    this.capturedArguments = argumentsOrTree;
    await Promise.resolve();
    return undefined;
  }
}

describe(TestNameGeneratorCommandRunner.name, () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("parses name options with the generator parser", () => {
    const parseStringOptionSpy = vi
      .spyOn(GeneratorService, "parseStringOption")
      .mockReturnValue("resource-name");
    const logger: LoggerLike = { log: vi.fn<(message: string) => void>() };
    const command = new TestNameGeneratorCommandRunner(logger);

    const result = command.parseNameOption("resource-name");

    expect(parseStringOptionSpy).toHaveBeenCalledWith("resource-name");
    expect(result).toBe("resource-name");
  });

  it("runs generator execution through GeneratorService", async () => {
    const logger: LoggerLike = { log: vi.fn<(message: string) => void>() };
    const command = new TestNameGeneratorCommandRunner(logger);
    const options: NameGeneratorOptions = {
      name: "resource-name",
    };
    const tree = createWorkspaceTree();
    const runGeneratorCommandSpy = vi
      .spyOn(GeneratorService, "runGeneratorCommand")
      .mockImplementation(async ({ generate }) => {
        await generate({ options, tree });
      });

    await command.run([], options);

    expect(runGeneratorCommandSpy).toHaveBeenCalledTimes(1);
    expect(command.capturedArguments).toStrictEqual({ options, tree });
    expect(runGeneratorCommandSpy.mock.calls[0]?.[0]).toMatchObject({
      logger,
      options,
      successMessage: "Generated test resource.",
    });
  });
});
