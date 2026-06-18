import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getProjects, workspaceRoot } from "@nx/devkit";
import _ from "lodash";

import { StringCase } from "../../types";
import { generateFiles, resolveName, resolveProject } from "../../utilities";

import type { GeneratorCallback, Tree } from "@nx/devkit";

interface GenerateNestjsGraphqlModuleOptions {
  name: string;
  project?: string;
}

export const TEMPLATES_DIRECTORY_PATH = fileURLToPath(
  new URL("templates", import.meta.url),
);

/**
 * Generates a new NestJS GraphQL module with resolver, entities, inputs, args,
 * service, types, constants, and unit test files.
 * Prompts for a project tagged `framework:nestjs` and places the module in `src/modules`.
 *
 * @param tree - The Nx virtual file system tree
 * @param options - Configuration options for the NestJS GraphQL module generator
 */
export async function generateNestjsGraphqlModule(
  tree: Tree,
  options: GenerateNestjsGraphqlModuleOptions,
): Promise<GeneratorCallback> {
  const { directory } = await resolveModuleDirectory(tree, options);

  const nameKebabCase = await resolveName({
    case: StringCase.KEBAB_CASE,
    message: "What is the name of the module? (kebab-case)",
    name: options.name,
    subject: "Module name",
  });

  const targetPath = path.join(directory, nameKebabCase);

  generateFiles({
    instanceDirectoryPath: targetPath,
    substitutions: buildNameSubstitutions(nameKebabCase),
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

function buildNameSubstitutions(nameKebabCase: string): Record<string, string> {
  return {
    nameCamelCase: _.camelCase(nameKebabCase),
    nameKebabCase,
    namePascalCase: _.upperFirst(_.camelCase(nameKebabCase)),
  };
}

async function resolveModuleDirectory(
  tree: Tree,
  options: GenerateNestjsGraphqlModuleOptions,
): Promise<{ directory: string; projectName: string }> {
  const projectName = await resolveProject({
    tag: "framework:nestjs",
    tree,
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

  if (!tree.exists(directory)) {
    throw new Error(
      `Directory "${directory}" does not exist in project "${projectName}"`,
    );
  }

  return { directory, projectName };
}
