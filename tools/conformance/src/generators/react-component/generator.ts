import path from "node:path";

import { formatFiles } from "@nx/devkit";
import _ from "lodash";

import { StringCase } from "../../types";
import {
  generateFiles,
  resolveName,
  resolveProject,
  resolveProjectDirectoryPath,
} from "../../utilities";

import type { Tree } from "@nx/devkit";

/**
 * Generate component options.
 */
interface GenerateComponentOptions {
  name: string;
  project?: string;
}

/**
 * Generates a new React component with TypeScript and test files.
 * Prompts for a project tagged `framework:react` and places the component in `src/components`.
 */
export async function generateComponent(
  tree: Tree,
  options: GenerateComponentOptions,
): Promise<void> {
  const projectName = await resolveProject({
    tag: "framework:react",
    tree,
    ...(options.project !== undefined && { project: options.project }),
    message: "Which project should the component be generated in?",
  });

  const name = await resolveName({
    case: StringCase.KEBAB_CASE,
    message: "What is the name of the component? (kebab-case)",
    name: options.name,
    subject: "Component name",
  });

  const componentsDirectory = resolveProjectDirectoryPath({
    directoryPath: path.join("src", "components"),
    projectName,
    tree,
  });

  const filesPath = path.join(__dirname, "templates");
  const substitutions = { namePascalCase: _.upperFirst(_.camelCase(name)) };

  generateFiles({
    instanceDirectoryPath: componentsDirectory,
    substitutions,
    templateDirectoryPath: filesPath,
    tree,
  });

  await formatFiles(tree);
}
