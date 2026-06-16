import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getProjects, workspaceRoot } from "@nx/devkit";
import _ from "lodash";

import { MODULES_DIRECTORY } from "../../constants";
import { StringCase } from "../../types";
import { generateFiles, resolveName, resolveProject } from "../../utilities";

import type { GeneratorCallback, Tree } from "@nx/devkit";

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
 *
 * @param tree - The Nx virtual file system tree
 * @param options - Configuration options for the NestJS DataLoader module generator
 */
export async function generateNestjsDataloaderModule(
  tree: Tree,
  options: GenerateNestjsDataloaderModuleOptions,
): Promise<GeneratorCallback> {
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

  const modulesDirectory = resolveProjectRoot(tree, projectName);
  const targetPath = path.join(modulesDirectory, nameKebabCase);
  const substitutions = buildSubstitutions(nameKebabCase);

  generateFiles({
    instanceDirectoryPath: targetPath,
    substitutions,
    templateDirectoryPath: TEMPLATES_DIRECTORY_PATH,
    tree,
  });

  const generatedFiles = tree
    .children(targetPath)
    .map((file) => path.join(targetPath, file));

  return buildGeneratorCallback(generatedFiles);
}

function buildGeneratorCallback(generatedFiles: string[]): GeneratorCallback {
  return () => {
    execSync(`pnpm exec nx format:write --files=${generatedFiles.join(",")}`, {
      cwd: workspaceRoot,
      stdio: "inherit",
    });
  };
}

function buildSubstitutions(nameKebabCase: string): {
  nameCamelCase: string;
  nameKebabCase: string;
  namePascalCase: string;
} {
  return {
    nameCamelCase: _.camelCase(nameKebabCase),
    nameKebabCase,
    namePascalCase: _.upperFirst(_.camelCase(nameKebabCase)),
  };
}

function resolveProjectRoot(tree: Tree, projectName: string): string {
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
