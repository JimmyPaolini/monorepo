import { execSync } from "node:child_process";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import { getProjects, workspaceRoot } from "@nx/devkit";
import _ from "lodash";
import { Command, CommandRunner } from "nest-commander";

import { MODULES_DIRECTORY } from "../../constants";
import { StringCase } from "../../types";
import { generateFiles, resolveName, resolveProject } from "../../utilities";
import { LoggerService } from "../logger/logger.service";

import {
  NESTJS_DATALOADER_MODULE_NAME_PROMPT,
  NESTJS_DATALOADER_MODULE_PROJECT_PROMPT,
  NESTJS_DATALOADER_MODULE_PROJECT_TAG,
  NESTJS_DATALOADER_MODULE_TEMPLATE_DIRECTORY_PATH,
} from "./nestjs-dataloader-module-generator.constants";

import type {
  NestjsDataloaderModuleGeneratorArguments,
  NestjsDataloaderModuleGeneratorOptions,
} from "./nestjs-dataloader-module-generator.types";
import type { GeneratorCallback, Tree } from "@nx/devkit";

/**
 * Generates NestJS DataLoader modules from the existing conformance templates.
 */
@Command({
  description: "Generate a NestJS DataLoader module scaffold",
  name: "nestjs-dataloader-module-generator",
})
@Injectable()
export class NestjsDataloaderModuleGeneratorCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(private readonly logger: LoggerService) {
    super();
    this.logger.setContext(NestjsDataloaderModuleGeneratorCommand.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

  /**
   * Auto-generated documentation placeholder.
   */
  async run(): Promise<void> {
    this.logger.log(
      "Generator command module scaffolded and ready for wiring.",
    );
    await Promise.resolve();
  }
}

/**
 * Migrated core generator logic for creating a NestJS DataLoader module.
 */
export async function generateNestjsDataloaderModuleGenerator(
  args: NestjsDataloaderModuleGeneratorArguments,
): Promise<GeneratorCallback> {
  const { options, tree } = args;
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
    templateDirectoryPath: path.join(
      workspaceRoot,
      NESTJS_DATALOADER_MODULE_TEMPLATE_DIRECTORY_PATH,
    ),
    tree,
  });

  const generatedFiles = tree
    .children(targetPath)
    .map((fileName: string) => path.join(targetPath, fileName));

  return () => {
    execSync(`pnpm exec nx format:write --files=${generatedFiles.join(",")}`, {
      cwd: workspaceRoot,
      stdio: "inherit",
    });
  };
}

/**
 * Auto-generated documentation placeholder.
 */
async function resolveProjectAndName(
  tree: Tree,
  options: NestjsDataloaderModuleGeneratorOptions,
): Promise<{ nameKebabCase: string; projectName: string }> {
  const projectName = await resolveProject({
    tag: NESTJS_DATALOADER_MODULE_PROJECT_TAG,
    tree,
    ...(options.project !== undefined && { project: options.project }),
    message: NESTJS_DATALOADER_MODULE_PROJECT_PROMPT,
  });

  const nameKebabCase = await resolveName({
    case: StringCase.KEBAB_CASE,
    message: NESTJS_DATALOADER_MODULE_NAME_PROMPT,
    name: options.name,
    subject: "Module name",
  });

  return { nameKebabCase, projectName };
}

/**
 * Auto-generated documentation placeholder.
 */
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
