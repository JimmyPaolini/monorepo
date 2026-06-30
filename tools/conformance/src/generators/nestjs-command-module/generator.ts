import path from "node:path";
import { fileURLToPath } from "node:url";

import { MODULES_DIRECTORY } from "../../constants";
import { StringCase } from "../../types";
import {
  buildKebabCaseNameSubstitutions,
  createFormatFilesCallback,
  generateFiles,
  resolveName,
  resolveProject,
  resolveProjectDirectoryPath,
} from "../../utilities";

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
  const directory = resolveProjectDirectoryPath({
    directoryPath: MODULES_DIRECTORY,
    projectName,
    tree,
  });

  const targetPath = path.join(directory, nameKebabCase);
  const substitutions = buildKebabCaseNameSubstitutions(nameKebabCase);

  generateFiles({
    instanceDirectoryPath: targetPath,
    substitutions,
    templateDirectoryPath: COMMAND_MODULE_TEMPLATES_DIRECTORY_PATH,
    tree,
  });

  return createFormatFilesCallback({ targetPath, tree });
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
