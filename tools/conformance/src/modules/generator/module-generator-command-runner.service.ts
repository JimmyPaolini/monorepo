import { CommandRunner, Option } from "nest-commander";

import { GeneratorService } from "./generator.service";

import type { GeneratorInvocationArguments } from "../../utilities";
import type { GeneratorCallback } from "@nx/devkit";

/**
 * Shared command runner for NestJS module generators with name + project flags.
 */
export abstract class ModuleGeneratorCommandRunner<
  TOptions extends { name?: string; project?: string },
> extends CommandRunner {
  protected constructor(
    protected readonly logger: {
      log: (message: string) => void;
    },
  ) {
    super();
  }

  protected abstract readonly successMessage: string;

  /**
   * Generates files for the command-specific module scaffold.
   */
  protected abstract generate(
    argumentsOrTree: GeneratorInvocationArguments<TOptions>,
  ): Promise<GeneratorCallback | undefined>;

  /**
   * Parses the optional module name argument.
   */
  @Option({
    description: "Module name in kebab-case",
    flags: "-n, --name [name]",
  })
  parseNameOption(value: string): string {
    return GeneratorService.parseStringOption(value);
  }

  /**
   * Parses the optional project name argument.
   */
  @Option({
    description: "Parent project name in kebab-case",
    flags: "-p, --project [project]",
  })
  parseProjectOption(value: string): string {
    return GeneratorService.parseStringOption(value);
  }

  /**
   * Runs the generator logic and writes generated files to disk.
   */
  async run(_passedParameters: string[], options: TOptions): Promise<void> {
    await GeneratorService.runGeneratorCommand({
      generate: async (argumentsOrTree) => this.generate(argumentsOrTree),
      logger: this.logger,
      options,
      successMessage: this.successMessage,
    });
  }
}
