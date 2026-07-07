import {
  isGeneratorInvocationArguments,
  normalizeGeneratorInvocationFromArguments,
  normalizeGeneratorInvocationFromTree,
} from "../../utilities";

import { NestjsCommandApplicationCommand } from "./nestjs-command-application.command";

import type {
  NestjsCommandApplicationArguments,
  NestjsCommandApplicationOptions,
} from "./nestjs-command-application.types";
import type { Tree } from "@nx/devkit";

/**
 * Generates the NestJS command application scaffold.
 */
export async function generateNestjsCommandApplication(
  argumentsOrTree: NestjsCommandApplicationArguments | Tree,
  options?: NestjsCommandApplicationOptions,
): Promise<void> {
  const { options: resolvedOptions, tree } = isGeneratorInvocationArguments(
    argumentsOrTree,
  )
    ? normalizeGeneratorInvocationFromArguments(argumentsOrTree)
    : normalizeGeneratorInvocationFromTree({
        options: options === undefined ? {} : options,
        tree: argumentsOrTree,
      });

  await NestjsCommandApplicationCommand.generateNestjsCommandApplication(
    tree,
    resolvedOptions,
  );
}
