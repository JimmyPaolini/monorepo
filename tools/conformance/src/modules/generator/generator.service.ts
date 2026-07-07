import { Injectable } from "@nestjs/common";

import {
  parseStringCommandOption,
  runGeneratorCommandWithCallback,
} from "../../utilities";

import type { GeneratorInvocationArguments } from "../../utilities";
import type { GeneratorCallback } from "@nx/devkit";

/**
 * Shared runner behavior for conformance command scaffolding.
 */
@Injectable()
export class GeneratorService {
  /**
   * Parses a string-valued generator option without coercion.
   */
  static parseStringOption(value: string): string {
    return parseStringCommandOption(value);
  }

  /**
   * Runs the generator and flushes the resulting workspace changes.
   */
  static async runGeneratorCommand<TOptions extends object>(args: {
    generate: (
      argumentsOrTree: GeneratorInvocationArguments<TOptions>,
    ) => Promise<GeneratorCallback | undefined>;
    logger: { log: (message: string) => void };
    options: TOptions;
    successMessage: string;
  }): Promise<void> {
    await runGeneratorCommandWithCallback(args);
  }
}
