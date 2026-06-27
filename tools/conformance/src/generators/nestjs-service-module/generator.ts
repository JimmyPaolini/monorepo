import { fileURLToPath } from "node:url";

import { generateNestjsModuleFromTemplates } from "../../utilities";

import type { GeneratorCallback, Tree } from "@nx/devkit";

/**
 * Generate nestjs service module options.
 */
interface GenerateNestjsServiceModuleOptions {
  name: string;
  project?: string;
}

/**
 * Absolute path to the template directory used by this generator.
 */
export const SERVICE_MODULE_TEMPLATES_DIRECTORY_PATH = fileURLToPath(
  new URL("templates", import.meta.url),
);

/**
 * Generates a service module under `<projectRoot>/src/modules/<name>` for a
 * `framework:nestjs` project and schedules formatting for created files.
 */
export async function generateNestjsServiceModule(
  tree: Tree,
  options: GenerateNestjsServiceModuleOptions,
): Promise<GeneratorCallback> {
  return generateNestjsModuleFromTemplates({
    name: options.name,
    ...(options.project !== undefined && { project: options.project }),
    templateDirectoryPath: SERVICE_MODULE_TEMPLATES_DIRECTORY_PATH,
    tree,
  });
}
