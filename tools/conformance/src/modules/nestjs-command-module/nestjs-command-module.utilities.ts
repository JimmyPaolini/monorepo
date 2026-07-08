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
  const { options: resolvedOptions, tree } =
    "options" in argumentsOrTree && "tree" in argumentsOrTree
      ? argumentsOrTree
      : {
          options: options ?? {},
          tree: argumentsOrTree,
        };

  return NestjsCommandModuleCommand.generateNestjsCommandModule(
    tree,
    resolvedOptions,
  );
}
