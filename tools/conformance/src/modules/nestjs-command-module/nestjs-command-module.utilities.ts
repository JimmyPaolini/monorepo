import {
  isGeneratorInvocationArguments,
  normalizeGeneratorInvocationFromArguments,
  normalizeGeneratorInvocationFromTree,
} from "../../utilities";

import { NestjsCommandModuleCommand } from "./nestjs-command-module.command";

import type {
  NestjsCommandModuleArguments,
  NestjsCommandModuleOptions,
} from "./nestjs-command-module.types";
import type { GeneratorCallback, Tree } from "@nx/devkit";

/**
 * Generates the NestJS command module scaffold.
 */
export async function generateNestjsCommandModule(
  argumentsOrTree: NestjsCommandModuleArguments | Tree,
  options?: NestjsCommandModuleOptions,
): Promise<GeneratorCallback> {
  const { options: resolvedOptions, tree } = isGeneratorInvocationArguments(
    argumentsOrTree,
  )
    ? normalizeGeneratorInvocationFromArguments(argumentsOrTree)
    : normalizeGeneratorInvocationFromTree({
        options: options === undefined ? {} : options,
        tree: argumentsOrTree,
      });

  return NestjsCommandModuleCommand.generateNestjsCommandModule(
    tree,
    resolvedOptions,
  );
}
