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
  const { options: resolvedOptions, tree } =
    "options" in argumentsOrTree && "tree" in argumentsOrTree
      ? argumentsOrTree
      : {
          options: options ?? {},
          tree: argumentsOrTree,
        };

  await NestjsGraphqlApplicationCommand.generateNestjsGraphqlApplication(
    tree,
    resolvedOptions,
  );
}
