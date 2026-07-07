import {
  isGeneratorInvocationArguments,
  normalizeGeneratorInvocationFromArguments,
  normalizeGeneratorInvocationFromTree,
} from "../../utilities";

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
  const { options: resolvedOptions, tree } = isGeneratorInvocationArguments(
    argumentsOrTree,
  )
    ? normalizeGeneratorInvocationFromArguments(argumentsOrTree)
    : normalizeGeneratorInvocationFromTree({
        options: options === undefined ? {} : options,
        tree: argumentsOrTree,
      });

  return NestjsGraphqlModuleCommand.generateNestjsGraphqlModule(
    tree,
    resolvedOptions,
  );
}
