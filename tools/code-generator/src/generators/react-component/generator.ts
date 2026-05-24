import path from "node:path";
import { fileURLToPath } from "node:url";

import { getProjects } from "@nx/devkit";

import { renderTemplates } from "../../generate-files";
import { nameVariables } from "../../name-variables";
import { StringCase } from "../../types";
import { resolveNameByCase, resolveProjectByTag } from "../../utilities";

import type { Tree } from "@nx/devkit";

interface GenerateComponentOptions {
  name: string;
  project?: string;
}

/**
 * Generates a new React component with TypeScript and test files.
 * Prompts for a project tagged `framework:react` and places the component in `src/components`.
 *
 * @param tree - The Nx virtual file system tree
 * @param options - Configuration options for the component generator
 */
export const TEMPLATES_DIRECTORY_PATH = fileURLToPath(
  new URL("templates", import.meta.url),
);

/**
 * Generates a React component from the Mustache template, placing the files
 * in the target project's `src/components/` directory.
 */
export async function generateComponent(
  tree: Tree,
  options: GenerateComponentOptions,
): Promise<void> {
  const projectName = await resolveProjectByTag({
    tree,
    tag: "framework:react",
    ...(options.project !== undefined && { project: options.project }),
    message: "Which project should the component be generated in?",
  });

  const name = await resolveNameByCase({
    name: options.name,
    case: StringCase.PASCAL_CASE,
    message: "What is the name of the component? (PascalCase)",
    subject: "Component name",
  });

  const allProjects = getProjects(tree);
  const projectConfig = allProjects.get(projectName);
  const projectRoot = projectConfig?.root ?? projectConfig?.sourceRoot;

  if (!projectRoot) {
    throw new Error(
      `Project "${projectName}" has no root directory configured`,
    );
  }

  const directory = path.join(projectRoot, "src", "components");

  // Validate directory exists in workspace
  if (!tree.exists(directory)) {
    throw new Error(
      `Directory "${directory}" does not exist in project "${projectName}"`,
    );
  }

  const vars = nameVariables(name);
  renderTemplates(tree, TEMPLATES_DIRECTORY_PATH, directory, vars);
}
