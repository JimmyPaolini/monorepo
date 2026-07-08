import { NestjsServiceFileCommand } from "./nestjs-service-file.command";

import type {
  NestjsServiceFileArguments,
  NestjsServiceFileOptions,
} from "./nestjs-service-file.types";
import type { GeneratorCallback, Tree } from "@nx/devkit";

/**
 * Generates the NestJS service file scaffold.
 */
export async function generateNestjsServiceFile(
  argumentsOrTree: NestjsServiceFileArguments | Tree,
  options?: NestjsServiceFileOptions,
): Promise<GeneratorCallback> {
  const { options: resolvedOptions, tree } =
    "options" in argumentsOrTree && "tree" in argumentsOrTree
      ? argumentsOrTree
      : {
          options: options ?? {},
          tree: argumentsOrTree,
        };

  return NestjsServiceFileCommand.generateNestjsServiceFile(
    tree,
    resolvedOptions,
  );
}
