import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createWorkspaceTree,
  type GeneratorInvocationArguments,
} from "../../utilities";

import { GeneratorService } from "./generator.service";
import { ModuleGeneratorCommandRunner } from "./module-generator-command-runner.service";

interface LoggerLike {
  log: (message: string) => void;
}

interface ModuleGeneratorOptions {
  name?: string;
  project?: string;
}

class TestModuleGeneratorCommandRunner extends ModuleGeneratorCommandRunner<ModuleGeneratorOptions> {
  constructor(logger: LoggerLike) {
    super(logger);
  }

  protected readonly successMessage = "Generated test module.";

  capturedArguments:
    | GeneratorInvocationArguments<ModuleGeneratorOptions>
    | undefined;

  protected override async generate(
    argumentsOrTree: GeneratorInvocationArguments<ModuleGeneratorOptions>,
  ): Promise<undefined> {
    this.capturedArguments = argumentsOrTree;
    await Promise.resolve();
    return undefined;
  }
}

describe(TestModuleGeneratorCommandRunner.name, () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("parses name options with the generator parser", () => {
    const parseStringOptionSpy = vi
      .spyOn(GeneratorService, "parseStringOption")
      .mockReturnValue("module-name");
    const logger: LoggerLike = { log: vi.fn<(message: string) => void>() };
    const command = new TestModuleGeneratorCommandRunner(logger);

    const result = command.parseNameOption("module-name");

    expect(parseStringOptionSpy).toHaveBeenCalledWith("module-name");
    expect(result).toBe("module-name");
  });

  it("parses project options with the generator parser", () => {
    const parseStringOptionSpy = vi
      .spyOn(GeneratorService, "parseStringOption")
      .mockReturnValue("project-name");
    const logger: LoggerLike = { log: vi.fn<(message: string) => void>() };
    const command = new TestModuleGeneratorCommandRunner(logger);

    const result = command.parseProjectOption("project-name");

    expect(parseStringOptionSpy).toHaveBeenCalledWith("project-name");
    expect(result).toBe("project-name");
  });

  it("runs generator execution through GeneratorService", async () => {
    const logger: LoggerLike = { log: vi.fn<(message: string) => void>() };
    const command = new TestModuleGeneratorCommandRunner(logger);
    const options: ModuleGeneratorOptions = {
      name: "module-name",
      project: "conformance",
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
      successMessage: "Generated test module.",
    });
  });
});
