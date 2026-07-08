import { NestjsGraphqlModuleCommand } from "./nestjs-graphql-module.command";

import type {
  NestjsGraphqlModuleArguments,
  NestjsGraphqlModuleOptions,
} from "./nestjs-graphql-module.types";
import type { GeneratorCallback, Tree } from "@nx/devkit";

/**
 * Generates the NestJS GraphQL module scaffold.
 */
export async function generateNestjsGraphqlModule(
  argumentsOrTree: NestjsGraphqlModuleArguments | Tree,
  options?: NestjsGraphqlModuleOptions,
): Promise<GeneratorCallback> {
  const { options: resolvedOptions, tree } =
    "options" in argumentsOrTree && "tree" in argumentsOrTree
      ? argumentsOrTree
      : {
          options: options ?? {},
          tree: argumentsOrTree,
        };

  return NestjsGraphqlModuleCommand.generateNestjsGraphqlModule(
    tree,
    resolvedOptions,
  );
}
