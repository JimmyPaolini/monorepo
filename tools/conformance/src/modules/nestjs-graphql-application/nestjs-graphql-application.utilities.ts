import {
  isGeneratorInvocationArguments,
  normalizeGeneratorInvocationFromArguments,
  normalizeGeneratorInvocationFromTree,
} from "../../utilities";

import { NestjsGraphqlApplicationCommand } from "./nestjs-graphql-application.command";

import type {
  NestjsGraphqlApplicationArguments,
  NestjsGraphqlApplicationOptions,
} from "./nestjs-graphql-application.types";
import type { Tree } from "@nx/devkit";

/**
 * Generates the NestJS GraphQL application scaffold.
 */
export async function generateNestjsGraphqlApplication(
  argumentsOrTree: NestjsGraphqlApplicationArguments | Tree,
  options?: NestjsGraphqlApplicationOptions,
): Promise<void> {
  const { options: resolvedOptions, tree } = isGeneratorInvocationArguments(
    argumentsOrTree,
  )
    ? normalizeGeneratorInvocationFromArguments(argumentsOrTree)
    : normalizeGeneratorInvocationFromTree({
        options: options === undefined ? {} : options,
        tree: argumentsOrTree,
      });

  await NestjsGraphqlApplicationCommand.generateNestjsGraphqlApplication(
    tree,
    resolvedOptions,
  );
}
