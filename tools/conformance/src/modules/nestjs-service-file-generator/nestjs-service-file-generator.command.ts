import { execSync } from "node:child_process";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import { getProjects, workspaceRoot } from "@nx/devkit";
import _ from "lodash";
import { Command, CommandRunner } from "nest-commander";
import prompts from "prompts";

import { MODULES_DIRECTORY } from "../../constants";
import { StringCase } from "../../types";
import { generateFiles, resolveName, resolveProject } from "../../utilities";
import { LoggerService } from "../logger/logger.service";

import {
  NESTJS_SERVICE_FILE_MODULE_PROMPT,
  NESTJS_SERVICE_FILE_NAME_PROMPT,
  NESTJS_SERVICE_FILE_PROJECT_PROMPT,
  NESTJS_SERVICE_FILE_PROJECT_TAG,
  NESTJS_SERVICE_FILE_TEMPLATE_DIRECTORY_PATH,
} from "./nestjs-service-file-generator.constants";

import type {
  NestjsServiceFileGeneratorArguments,
  NestjsServiceFileGeneratorOptions,
} from "./nestjs-service-file-generator.types";
import type { GeneratorCallback, Tree } from "@nx/devkit";
import type { Choice, PromptObject } from "prompts";

/**
 * TODO: Document the nestjsServiceFileGenerator command.
 */
@Command({
  description: "Run the nestjs-service-file-generator command",
  name: "nestjs-service-file-generator",
})
@Injectable()
export class NestjsServiceFileGeneratorCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(private readonly logger: LoggerService) {
    super();
    this.logger.setContext(NestjsServiceFileGeneratorCommand.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

  /**
   * Logs module readiness until command wiring is connected.
   */
  async run(): Promise<void> {
    this.logger.debug(generateNestjsServiceFileGenerator.name);
    this.logger.log(
      "Generator command module scaffolded and ready for wiring.",
    );
    await Promise.resolve();
  }
}

/**
 * Migrated core generator logic for creating NestJS service files.
 */
export async function generateNestjsServiceFileGenerator(
  args: NestjsServiceFileGeneratorArguments,
): Promise<GeneratorCallback> {
  const { options, tree } = args;
  const { moduleName, nameKebabCase, projectName } =
    await resolveProjectAndName(tree, options);
  const modulesDirectory = resolveValidatedModulesDirectory(tree, projectName);
  const targetPath = path.join(modulesDirectory, moduleName);
  const substitutions = {
    nameCamelCase: _.camelCase(nameKebabCase),
    nameKebabCase,
    namePascalCase: _.upperFirst(_.camelCase(nameKebabCase)),
  };

  generateFiles({
    instanceDirectoryPath: targetPath,
    substitutions,
    templateDirectoryPath: path.join(
      process.cwd(),
      NESTJS_SERVICE_FILE_TEMPLATE_DIRECTORY_PATH,
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
 * Prompts the user to select a target module when one is not provided.
 */
async function promptModuleSelection(args: {
  message: string;
  modules: string[];
}): Promise<string> {
  const { message, modules } = args;
  const request: PromptObject<"module"> = {
    choices: modules.map(
      (name: string): Choice => ({
        title: name,
        value: name,
      }),
    ),
    message,
    name: "module",
    type: "select",
  };
  const response: { module: string | undefined } = await prompts(request);

  if (!response.module) {
    throw new Error("No module selected");
  }

  return response.module;
}

/**
 * Resolves and validates the destination module for generated service files.
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
    .filter((childNodeName: string) => {
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
 * Resolves project, service name, and module destination for generation.
 */
async function resolveProjectAndName(
  tree: Tree,
  options: NestjsServiceFileGeneratorOptions,
): Promise<{ moduleName: string; nameKebabCase: string; projectName: string }> {
  const projectName = await resolveProject({
    tag: NESTJS_SERVICE_FILE_PROJECT_TAG,
    tree,
    ...(options.project !== undefined && { project: options.project }),
    message: NESTJS_SERVICE_FILE_PROJECT_PROMPT,
  });
  const nameKebabCase = await resolveName({
    case: StringCase.KEBAB_CASE,
    message: NESTJS_SERVICE_FILE_NAME_PROMPT,
    name: options.name,
    subject: "Service name",
  });
  const moduleName = await resolveModuleName({
    message: NESTJS_SERVICE_FILE_MODULE_PROMPT,
    modulesDirectoryPath: resolveValidatedModulesDirectory(tree, projectName),
    tree,
    ...(options.module !== undefined && { module: options.module }),
  });

  return { moduleName, nameKebabCase, projectName };
}

/**
 * Resolves and validates the modules directory for the selected project.
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
