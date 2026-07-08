import { NestjsServiceModuleCommand } from "./nestjs-service-module.command";

import type {
  NestjsServiceModuleArguments,
  NestjsServiceModuleOptions,
} from "./nestjs-service-module.types";
import type { GeneratorCallback, Tree } from "@nx/devkit";

/**
 * Generates the NestJS service module scaffold.
 */
export async function generateNestjsServiceModule(
  argumentsOrTree: NestjsServiceModuleArguments | Tree,
  options?: NestjsServiceModuleOptions,
): Promise<GeneratorCallback> {
  const { options: resolvedOptions, tree } =
    "options" in argumentsOrTree && "tree" in argumentsOrTree
      ? argumentsOrTree
      : {
          options: options ?? {},
          tree: argumentsOrTree,
        };

  return NestjsServiceModuleCommand.generateNestjsServiceModule(
    tree,
    resolvedOptions,
  );
}
