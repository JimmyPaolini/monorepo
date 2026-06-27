import { fileURLToPath } from "node:url";

import { generateNestjsModuleFromTemplates } from "../../utilities";

import type { GeneratorCallback, Tree } from "@nx/devkit";

/**
 * Generate nestjs dataloader module options.
 */
interface GenerateNestjsDataloaderModuleOptions {
  name: string;
  project?: string;
}

export const TEMPLATES_DIRECTORY_PATH = fileURLToPath(
  new URL("templates", import.meta.url),
);

/**
 * Generates a new NestJS DataLoader module with dataloader, types, and unit test files.
 * Prompts for a project tagged `framework:nestjs` and places the module in `src/modules`.
 */
export async function generateNestjsDataloaderModule(
  tree: Tree,
  options: GenerateNestjsDataloaderModuleOptions,
): Promise<GeneratorCallback> {
  return generateNestjsModuleFromTemplates({
    name: options.name,
    ...(options.project !== undefined && { project: options.project }),
    templateDirectoryPath: TEMPLATES_DIRECTORY_PATH,
    tree,
  });
}
