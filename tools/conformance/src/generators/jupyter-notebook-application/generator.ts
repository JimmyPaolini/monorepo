import path from "node:path";
import { fileURLToPath } from "node:url";

import { formatFiles, type Tree } from "@nx/devkit";

import { APPLICATIONS_DIRECTORY } from "../../constants";
import { StringCase } from "../../types";
import { generateFiles, resolveName } from "../../utilities";

/**
 * Generate jupyter notebook application options.
 */
interface GenerateJupyterNotebookApplicationOptions {
  description?: string;
  name?: string;
}

const TEMPLATES_DIRECTORY_PATH = fileURLToPath(
  new URL("templates", import.meta.url),
);

/**
 * Generates a Python Jupyter notebook application scaffold in applications/<name>.
 */
export async function generateJupyterNotebookApplication(
  tree: Tree,
  options: GenerateJupyterNotebookApplicationOptions,
): Promise<void> {
  const applicationName = await resolveName({
    ...(options.name !== undefined && { name: options.name }),
    case: StringCase.KEBAB_CASE,
    message:
      "What is the name of the Jupyter notebook application? (kebab-case)",
    subject: "Application name",
  });
  const targetDirectory = path.join(APPLICATIONS_DIRECTORY, applicationName);

  if (tree.exists(targetDirectory)) {
    throw new Error(
      `Directory "${targetDirectory}" already exists. Choose a different application name.`,
    );
  }

  generateFiles({
    instanceDirectoryPath: targetDirectory,
    substitutions: {
      description:
        options.description ??
        `A Python + Jupyter notebook application scaffold for ${applicationName}`,
      name: applicationName,
    },
    templateDirectoryPath: TEMPLATES_DIRECTORY_PATH,
    tree,
  });

  await formatFiles(tree);
}
