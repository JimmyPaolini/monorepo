import { CommandRunner, Option } from "nest-commander";

import { GeneratorService } from "./generator.service";

import type { GeneratorInvocationArguments } from "../../utilities";
import type { GeneratorCallback } from "@nx/devkit";

/**
 * Shared command runner for generators with a single optional --name flag.
 */
export abstract class NameGeneratorCommandRunner<
  TOptions extends { name?: string },
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
   * Generates files for the command-specific scaffold.
   */
  protected abstract generate(
    argumentsOrTree: GeneratorInvocationArguments<TOptions>,
  ): Promise<GeneratorCallback | undefined>;

  /**
   * Parses the optional name argument.
   */
  @Option({
    description: "Name in kebab-case",
    flags: "-n, --name [name]",
  })
  parseNameOption(value: string): string {
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
