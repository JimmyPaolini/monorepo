import { fileURLToPath } from "node:url";

import { generateNestjsModuleFromTemplates } from "../../utilities";

import type { GeneratorCallback, Tree } from "@nx/devkit";

/**
 * Generate nestjs graphql module options.
 */
interface GenerateNestjsGraphqlModuleOptions {
  name: string;
  project?: string;
}

export const GRAPHQL_MODULE_TEMPLATES_DIRECTORY_PATH = fileURLToPath(
  new URL("templates", import.meta.url),
);

/**
 * Generates a new NestJS GraphQL module with resolver, entities, inputs, args,
 * service, types, constants, and unit test files.
 * Prompts for a project tagged `framework:nestjs` and places the module in `src/modules`.
 */
export async function generateNestjsGraphqlModule(
  tree: Tree,
  options: GenerateNestjsGraphqlModuleOptions,
): Promise<GeneratorCallback> {
  return generateNestjsModuleFromTemplates({
    name: options.name,
    ...(options.project !== undefined && { project: options.project }),
    templateDirectoryPath: GRAPHQL_MODULE_TEMPLATES_DIRECTORY_PATH,
    tree,
  });
}
