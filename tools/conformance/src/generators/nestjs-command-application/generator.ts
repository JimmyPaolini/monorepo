import path from "node:path";
import { fileURLToPath } from "node:url";

import { formatFiles, type Tree } from "@nx/devkit";
import _ from "lodash";

import { StringCase } from "../../types";
import {
  generateFiles,
  resolveDestinationRoot,
  resolveName,
} from "../../utilities";

/**
 * Generate nestjs command application options.
 */
interface GenerateNestjsCommandApplicationOptions {
  destinationRoot?: string;
  name?: string;
}

export const COMMAND_APPLICATION_TEMPLATES_DIRECTORY_PATH = fileURLToPath(
  new URL("templates", import.meta.url),
);

/**
 * Generates a new NestJS command-line application scaffold using nest-commander.
 */
export async function generateNestjsCommandApplication(
  tree: Tree,
  options: GenerateNestjsCommandApplicationOptions,
): Promise<void> {
  const nameKebabCase = await resolveName({
    ...(options.name !== undefined && { name: options.name }),
    case: StringCase.KEBAB_CASE,
    message: "What is the name of the application? (kebab-case)",
    subject: "Application name",
  });

  const destinationRoot = await resolveDestinationRoot({
    ...(options.destinationRoot !== undefined && {
      destinationRoot: options.destinationRoot,
    }),
    message: "Where should the NestJS command application be generated?",
  });

  const projectRoot = path.join(destinationRoot, nameKebabCase);

  if (tree.exists(projectRoot)) {
    throw new Error(
      `Directory "${projectRoot}" already exists. Choose a different application name.`,
    );
  }

  const substitutions = {
    destinationRoot,
    nameCamelCase: _.camelCase(nameKebabCase),
    nameKebabCase,
    namePascalCase: _.upperFirst(_.camelCase(nameKebabCase)),
  };

  generateFiles({
    instanceDirectoryPath: projectRoot,
    substitutions,
    templateDirectoryPath: COMMAND_APPLICATION_TEMPLATES_DIRECTORY_PATH,
    tree,
  });

  await formatFiles(tree);
}
