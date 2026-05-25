import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getProjects, workspaceRoot } from "@nx/devkit";
import _ from "lodash";

import { StringCase } from "../../types";
import { generateFiles, resolveName, resolveProject } from "../../utilities";

import type { GeneratorCallback, Tree } from "@nx/devkit";

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
export const MODULES_DIRECTORY = "src/modules";
export const TEMPLATES_DIRECTORY_PATH = fileURLToPath(
  new URL("templates", import.meta.url),
);

/**
 *
 */
export async function generateNestjsServiceModule(
  tree: Tree,
  options: GenerateNestjsServiceModuleOptions,
): Promise<GeneratorCallback> {
  const projectName = await resolveProject({
    tree,
    tag: "framework:nestjs",
    ...(options.project !== undefined && { project: options.project }),
    message: "Which project should the module be generated in?",
  });

  const name = await resolveName({
    name: options.name,
    case: StringCase.CAMEL_CASE,
    message: "What is the name of the module? (camelCase)",
    subject: "Module name",
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
  const substitutions = { nameCamelCase, namePascalCase };

  generateFiles({
    tree,
    templateDirectoryPath: TEMPLATES_DIRECTORY_PATH,
    instanceDirectoryPath: targetPath,
    substitutions,
  });

  const generatedFiles = tree
    .children(targetPath)
    .map((file) => path.join(targetPath, file));

  return () => {
    execSync(`pnpm exec nx format:write --files=${generatedFiles.join(",")}`, {
      cwd: workspaceRoot,
      stdio: "inherit",
    });
  };
}
