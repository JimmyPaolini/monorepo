import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getProjects, workspaceRoot } from "@nx/devkit";
import _ from "lodash";
import prompts from "prompts";

import { MODULES_DIRECTORY } from "../../constants";
import { StringCase } from "../../types";
import { generateFiles, resolveName, resolveProject } from "../../utilities";

import type { GeneratorCallback, Tree } from "@nx/devkit";
import type { Choice, PromptObject } from "prompts";

/**
 * Configuration options for the NestJS service file generator.
 */
interface GenerateNestjsServiceFileOptions {
  module?: string;
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
 * Generates service files under `<projectRoot>/src/modules/<module>` for a
 * `framework:nestjs` project and schedules formatting for created files.
 */
export async function generateNestjsServiceFile(
  tree: Tree,
  options: GenerateNestjsServiceFileOptions,
): Promise<GeneratorCallback> {
  const { moduleName, nameKebabCase, projectName } =
    await resolveProjectAndName(tree, options);
  const modulesDirectory = resolveValidatedModulesDirectoryPath(
    tree,
    projectName,
  );
  const targetPath = path.join(modulesDirectory, moduleName);
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

/**
 * Prompts the user to select a module from a list and returns the chosen name.
 */
async function promptModuleSelection(args: {
  message: string;
  modules: string[];
}): Promise<string> {
  const { message, modules } = args;
  const request: PromptObject<"module"> = {
    choices: modules.map((name): Choice => ({ title: name, value: name })),
    message,
    name: "module",
    type: "select",
  };
  const response: { module: string | undefined } = await prompts(request);
  if (!response.module) {
    throw new Error("No module selected");
  }
  const moduleName = response.module;
  return moduleName;
}

/**
 * Resolves and validates the target module name for service file generation.
 */
async function resolveModuleName(args: {
  message: string;
  module?: string;
  modulesDirectoryPath: string;
  tree: Tree;
}): Promise<string> {
  const { message, module, modulesDirectoryPath, tree } = args;
  const availableModules = tree
    .children(modulesDirectoryPath)
    .filter((childNodeName) => {
      return (
        tree.children(path.join(modulesDirectoryPath, childNodeName)).length > 0
      );
    });

  if (availableModules.length === 0) {
    throw new Error(
      `No modules found in "${modulesDirectoryPath}". Create a module first before generating service files.`,
    );
  }

  const moduleName =
    module ??
    (await promptModuleSelection({
      message,
      modules: availableModules.toSorted(),
    }));

  if (!availableModules.includes(moduleName)) {
    throw new Error(
      `Module "${moduleName}" does not exist in "${modulesDirectoryPath}". Available modules: ${availableModules.toSorted().join(", ")}`,
    );
  }

  return moduleName;
}

/**
 * Resolves and validates the target project and service name inputs.
 */
async function resolveProjectAndName(
  tree: Tree,
  options: GenerateNestjsServiceFileOptions,
): Promise<{
  moduleName: string;
  nameKebabCase: string;
  projectName: string;
}> {
  const projectName = await resolveProject({
    tag: "framework:nestjs",
    tree,
    ...(options.project !== undefined && { project: options.project }),
    message: "Which project should the service files be generated in?",
  });
  const nameKebabCase = await resolveName({
    case: StringCase.KEBAB_CASE,
    message: "What is the name of the service? (kebab-case)",
    name: options.name,
    subject: "Service name",
  });
  const moduleName = await resolveModuleName({
    message: "Which module should the service files be generated in?",
    modulesDirectoryPath: resolveValidatedModulesDirectoryPath(
      tree,
      projectName,
    ),
    tree,
    ...(options.module !== undefined && { module: options.module }),
  });
  return { moduleName, nameKebabCase, projectName };
}

/**
 * Resolves and validates the target project's modules directory path.
 */
function resolveValidatedModulesDirectoryPath(
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
