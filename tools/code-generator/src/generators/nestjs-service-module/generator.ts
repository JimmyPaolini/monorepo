import path from "node:path";

import { formatFiles, generateFiles, getProjects } from "@nx/devkit";
import _ from "lodash";

import { StringCase } from "../../types";
import { resolveNameByCase, resolveProjectByTag } from "../../utilities";

import type { Tree } from "@nx/devkit";

interface GenerateNestjsServiceModuleOptions {
  name: string;
  project?: string;
}

/**
 * Generates a new NestJS service module with module, service, types, constants, and unit test files.
 * Prompts for a project tagged `framework:nestjs` and places the module in `src/modules`.
 *
 * @param tree - The Nx virtual file system tree
 * @param options - Configuration options for the NestJS service module generator
 */
export async function generateNestjsServiceModule(
  tree: Tree,
  options: GenerateNestjsServiceModuleOptions,
): Promise<void> {
  const name = await resolveNameByCase({
    name: options.name,
    case: StringCase.CAMEL_CASE,
    message: "What is the name of the module? (camelCase)",
    subject: "Module name",
  });

  const projectName = await resolveProjectByTag({
    tree,
    tag: "framework:nestjs",
    ...(options.project !== undefined && { project: options.project }),
    message: "Which project should the module be generated in?",
  });

  const allProjects = getProjects(tree);
  const projectConfig = allProjects.get(projectName);
  const projectRoot = projectConfig?.root ?? projectConfig?.sourceRoot;

  if (!projectRoot) {
    throw new Error(
      `Project "${projectName}" has no root directory configured`,
    );
  }

  const directory = path.join(projectRoot, "src", "modules");

  // Validate directory exists in workspace
  if (!tree.exists(directory)) {
    throw new Error(
      `Directory "${directory}" does not exist in project "${projectName}"`,
    );
  }

  const nameCamelCase = name;
  const namePascalCase = _.upperFirst(name);

  const targetPath = path.join(directory, nameCamelCase);
  const filesPath = path.join(__dirname, "templates");
  const substitutions = { nameCamelCase, namePascalCase };

  generateFiles(tree, filesPath, targetPath, substitutions);
  await formatFiles(tree);
}
