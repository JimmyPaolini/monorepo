import * as path from "path";

import { formatFiles, generateFiles } from "@nx/devkit";
import _ from "lodash";

import type { Tree } from "@nx/devkit";

interface GenerateComponentOptions {
  name: string;
  directory: string;
}

export async function generateComponent(
  tree: Tree,
  options: GenerateComponentOptions,
): Promise<void> {
  const { name, directory } = options;

  const namePascalCase = _.upperFirst(_.camelCase(name));
  const nameKebabCase = _.kebabCase(name);

  // Validate name is PascalCase
  if (name !== namePascalCase) {
    throw new Error(
      `Component name "${name}" must be in PascalCase. Did you mean "${namePascalCase}"?`,
    );
  }

  // Validate directory path
  if (directory.includes("..") || directory.startsWith("/")) {
    throw new Error(
      `Directory "${directory}" must be a relative path without ".." or leading "/"`,
    );
  }

  // Validate directory exists in workspace
  if (!tree.exists(directory)) {
    throw new Error(`Directory "${directory}" does not exist in the workspace`);
  }

  const filesPath = path.join(__dirname, "files");
  const substitutions = { namePascalCase, nameKebabCase };
  generateFiles(tree, filesPath, directory, substitutions);
  await formatFiles(tree);
}
