import {
  isGeneratorInvocationArguments,
  normalizeGeneratorInvocationFromArguments,
  normalizeGeneratorInvocationFromTree,
} from "../../utilities";

import { NestjsDataloaderModuleCommand } from "./nestjs-dataloader-module.command";

import type {
  NestjsDataloaderModuleArguments,
  NestjsDataloaderModuleOptions,
} from "./nestjs-dataloader-module.types";
import type { GeneratorCallback, Tree } from "@nx/devkit";

/**
 * Generates the NestJS DataLoader module scaffold.
 */
export async function generateNestjsDataloaderModule(
  argumentsOrTree: NestjsDataloaderModuleArguments | Tree,
  options?: NestjsDataloaderModuleOptions,
): Promise<GeneratorCallback> {
  const { options: resolvedOptions, tree } = isGeneratorInvocationArguments(
    argumentsOrTree,
  )
    ? normalizeGeneratorInvocationFromArguments(argumentsOrTree)
    : normalizeGeneratorInvocationFromTree({
        options: options === undefined ? {} : options,
        tree: argumentsOrTree,
      });

  return NestjsDataloaderModuleCommand.generateNestjsDataloaderModule(
    tree,
    resolvedOptions,
  );
}
