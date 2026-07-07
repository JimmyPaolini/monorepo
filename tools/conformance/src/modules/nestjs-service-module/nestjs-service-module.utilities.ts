import {
  isGeneratorInvocationArguments,
  normalizeGeneratorInvocationFromArguments,
  normalizeGeneratorInvocationFromTree,
} from "../../utilities";

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
  const { options: resolvedOptions, tree } = isGeneratorInvocationArguments(
    argumentsOrTree,
  )
    ? normalizeGeneratorInvocationFromArguments(argumentsOrTree)
    : normalizeGeneratorInvocationFromTree({
        options: options === undefined ? {} : options,
        tree: argumentsOrTree,
      });

  return NestjsServiceModuleCommand.generateNestjsServiceModule(
    tree,
    resolvedOptions,
  );
}
