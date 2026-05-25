import path from "node:path";

import { formatFiles, getProjects } from "@nx/devkit";

import { StringCase } from "../../types";
import { generateFiles, resolveName, resolveProject } from "../../utilities";

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
export async function generateComponent(
  tree: Tree,
  options: GenerateComponentOptions,
): Promise<void> {
  const projectName = await resolveProject({
    tree,
    tag: "framework:react",
    ...(options.project !== undefined && { project: options.project }),
    message: "Which project should the component be generated in?",
  });

  const name = await resolveName({
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

  const namePascalCase = name;

  const filesPath = path.join(__dirname, "templates");
  const substitutions = { namePascalCase };
  generateFiles({
    tree,
    templateDirectoryPath: filesPath,
    instanceDirectoryPath: directory,
    substitutions,
  });
  await formatFiles(tree);
}
