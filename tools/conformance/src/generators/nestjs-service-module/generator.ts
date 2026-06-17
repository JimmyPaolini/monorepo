import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getProjects, workspaceRoot } from "@nx/devkit";
import _ from "lodash";

import { MODULES_DIRECTORY } from "../../constants";
import { StringCase } from "../../types";
import { generateFiles, resolveName, resolveProject } from "../../utilities";

import type { GeneratorCallback, Tree } from "@nx/devkit";

interface GenerateNestjsServiceModuleOptions {
  name: string;
  project?: string;
}

/**
 * Absolute path to the template directory used by this generator.
 */
export const TEMPLATES_DIRECTORY_PATH = fileURLToPath(
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
  const { nameKebabCase, projectName } = await resolveProjectAndName(
    tree,
    options,
  );
  const modulesDirectory = resolveValidatedModulesDirectory(tree, projectName);
  const targetPath = path.join(modulesDirectory, nameKebabCase);
  const substitutions = {
    nameCamelCase: _.camelCase(nameKebabCase),
    nameKebabCase,
    namePascalCase: _.upperFirst(_.camelCase(nameKebabCase)),
  };
  generateFiles({
    instanceDirectoryPath: targetPath,
    substitutions,
    templateDirectoryPath: TEMPLATES_DIRECTORY_PATH,
    tree,
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

async function resolveProjectAndName(
  tree: Tree,
  options: GenerateNestjsServiceModuleOptions,
): Promise<{ nameKebabCase: string; projectName: string }> {
  const projectName = await resolveProject({
    tag: "framework:nestjs",
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

function resolveValidatedModulesDirectory(
  tree: Tree,
  projectName: string,
): string {
  const allProjects = getProjects(tree);
  const projectConfig = allProjects.get(projectName);
  const projectRoot = projectConfig?.root ?? projectConfig?.sourceRoot;
  if (!projectRoot) {
    throw new Error(
      `Project "${projectName}" has no root directory configured`,
    );
  }
  const modulesDirectory = path.join(projectRoot, MODULES_DIRECTORY);
  if (!tree.exists(modulesDirectory)) {
    throw new Error(
      `Directory "${modulesDirectory}" does not exist in project "${projectName}"`,
    );
  }
  return modulesDirectory;
}
