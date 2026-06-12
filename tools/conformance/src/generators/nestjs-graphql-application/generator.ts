import path from "node:path";
import { fileURLToPath } from "node:url";

import { formatFiles, type Tree } from "@nx/devkit";
import _ from "lodash";

import { StringCase } from "../../types";
import { generateFiles, resolveName } from "../../utilities";

interface GenerateNestjsGraphqlApplicationOptions {
  name?: string;
}

export const APPLICATIONS_DIRECTORY = "applications";
export const TEMPLATES_DIRECTORY_PATH = fileURLToPath(
  new URL("templates", import.meta.url),
);

/**
 * Generates a new NestJS GraphQL API application scaffold.
 *
 * @param tree - The Nx virtual file system tree
 * @param options - Configuration options for the NestJS GraphQL application
 */
export async function generateNestjsGraphqlApplication(
  tree: Tree,
  options: GenerateNestjsGraphqlApplicationOptions,
): Promise<void> {
  const nameKebabCase = await resolveName({
    ...(options.name !== undefined && { name: options.name }),
    case: StringCase.KEBAB_CASE,
    message: "What is the name of the application? (kebab-case)",
    subject: "Application name",
  });

  const projectRoot = path.join(APPLICATIONS_DIRECTORY, nameKebabCase);

  if (tree.exists(projectRoot)) {
    throw new Error(
      `Directory "${projectRoot}" already exists. Choose a different application name.`,
    );
  }

  const substitutions = {
    nameCamelCase: _.camelCase(nameKebabCase),
    nameKebabCase,
    namePascalCase: _.upperFirst(_.camelCase(nameKebabCase)),
  };

  generateFiles({
    instanceDirectoryPath: projectRoot,
    substitutions,
    templateDirectoryPath: TEMPLATES_DIRECTORY_PATH,
    tree,
  });

  await formatFiles(tree);
}
