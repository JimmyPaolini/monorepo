import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getProjects, workspaceRoot } from "@nx/devkit";
import _ from "lodash";

import { StringCase } from "../../types";
import { generateFiles, resolveName, resolveProject } from "../../utilities";

import type { GeneratorCallback, Tree } from "@nx/devkit";

/**
 * Generate nestjs command module options.
 */
interface GenerateNestjsCommandModuleOptions {
  name: string;
  project?: string;
}

/**
 * Absolute path to the template directory used by this generator.
 */
export const COMMAND_MODULE_TEMPLATES_DIRECTORY_PATH = fileURLToPath(
  new URL("templates", import.meta.url),
);

/**
 * Generates a command module under `<projectRoot>/src/modules/<name>` for a
 * `framework:nest-commander` project and schedules formatting for created files.
 */
export async function generateNestjsCommandModule(
  tree: Tree,
  options: GenerateNestjsCommandModuleOptions,
): Promise<GeneratorCallback> {
  const { nameKebabCase, projectName } = await resolveInputs(tree, options);
  const directory = resolveProjectDirectory(tree, projectName);

  const targetPath = path.join(directory, nameKebabCase);
  const substitutions = {
    nameCamelCase: _.camelCase(nameKebabCase),
    nameKebabCase,
    namePascalCase: _.upperFirst(_.camelCase(nameKebabCase)),
  };

  generateFiles({
    instanceDirectoryPath: targetPath,
    substitutions,
    templateDirectoryPath: COMMAND_MODULE_TEMPLATES_DIRECTORY_PATH,
    tree,
  });

  const generatedFiles = tree
    .children(targetPath)
    .map((file) => path.join(targetPath, file));

  return () => {
    execSync(`pnpm exec nx format:write --files=${generatedFiles.join(",")}`, {
      cwd: workspaceRoot,
    });
  };
}

/**
 * Resolve inputs.
 */
async function resolveInputs(
  tree: Tree,
  options: GenerateNestjsCommandModuleOptions,
): Promise<{ nameKebabCase: string; projectName: string }> {
  const projectName = await resolveProject({
    tag: "framework:nest-commander",
    tree,
    ...(options.project !== undefined && { project: options.project }),
    message: "Which project should the module be generated in?",
  });

  const nameKebabCase = await resolveName({
    case: StringCase.KEBAB_CASE,
    message: "What is the name of the module? (kebab-case)",
    name: options.name,
    subject: "Module name",
  });

  return { nameKebabCase, projectName };
}

/**
 * Resolve project directory.
 */
function resolveProjectDirectory(tree: Tree, projectName: string): string {
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

  return directory;
}
