import path from "node:path";

import { Injectable } from "@nestjs/common";
import { Command } from "nest-commander";

import {
  buildKebabCaseNameSubstitutions,
  type GeneratorInvocationArguments,
  isGeneratorInvocationArguments,
  normalizeGeneratorInvocationFromArguments,
  normalizeGeneratorInvocationFromTree,
  resolveProjectModulesDirectoryPath,
} from "../../utilities";
import { GeneratorRunnerService } from "../generator/generator-runner.service";
import { ModuleGeneratorCommandRunner } from "../generator/module-generator-command-runner.service";
import { LoggerService } from "../logger/logger.service";

import {
  NESTJS_DATALOADER_MODULE_NAME_PROMPT,
  NESTJS_DATALOADER_MODULE_PROJECT_PROMPT,
  NESTJS_DATALOADER_MODULE_PROJECT_TAG,
  NESTJS_DATALOADER_MODULE_TEMPLATE_DIRECTORY_PATH,
} from "./nestjs-dataloader-module.constants";

import type {
  NestjsDataloaderModuleArguments,
  NestjsDataloaderModuleOptions,
} from "./nestjs-dataloader-module.types";
import type { GeneratorCallback, Tree } from "@nx/devkit";

/**
 * Generates NestJS DataLoader modules from the existing conformance templates.
 */
@Command({
  description: "Generate a NestJS DataLoader module scaffold",
  name: "nestjs-dataloader-module",
})
@Injectable()
export class NestjsDataloaderModuleCommand extends ModuleGeneratorCommandRunner<NestjsDataloaderModuleOptions> {
  // 🏗 Dependency Injection

  constructor(logger: LoggerService) {
    super(logger);
    logger.setContext(NestjsDataloaderModuleCommand.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  protected readonly successMessage =
    "Generated NestJS DataLoader module scaffold.";

  // 🔏 Private Methods

  /**
   * Migrated core generator logic for creating a NestJS DataLoader module.
   */
  static async generateNestjsDataloaderModule(
    argumentsOrTree: NestjsDataloaderModuleArguments,
  ): Promise<GeneratorCallback>;
  // 🌎 Public Methods
  /**
   * Overload signature for tree and options based invocation.
   */
  static async generateNestjsDataloaderModule(
    tree: Tree,
    options?: NestjsDataloaderModuleOptions,
  ): Promise<GeneratorCallback>;
  /**
   * Overload signature for tree and options based invocation.
   */
  static async generateNestjsDataloaderModule(
    argumentsOrTree: NestjsDataloaderModuleArguments | Tree,
    options?: NestjsDataloaderModuleOptions,
  ): Promise<GeneratorCallback> {
    const resolvedArguments =
      isGeneratorInvocationArguments<NestjsDataloaderModuleOptions>(
        argumentsOrTree,
      )
        ? normalizeGeneratorInvocationFromArguments<NestjsDataloaderModuleOptions>(
            argumentsOrTree,
          )
        : normalizeGeneratorInvocationFromTree<NestjsDataloaderModuleOptions>({
            ...(options !== undefined && { options }),
            tree: argumentsOrTree,
          });

    return GeneratorRunnerService.generateCallbackTemplateScaffoldWithProjectAndName<NestjsDataloaderModuleOptions>(
      {
        argumentsOrTree: resolvedArguments,
        nameMessage: NESTJS_DATALOADER_MODULE_NAME_PROMPT,
        nameSubject: "Module name",
        projectMessage: NESTJS_DATALOADER_MODULE_PROJECT_PROMPT,
        projectTag: NESTJS_DATALOADER_MODULE_PROJECT_TAG,
        resolveGenerationWithProjectAndName: ({
          nameKebabCase,
          projectName,
          tree,
        }) => {
          const modulesDirectory = resolveProjectModulesDirectoryPath({
            projectName,
            tree,
          });
          const targetPath = path.join(modulesDirectory, nameKebabCase);

          return {
            instanceDirectoryPath: targetPath,
            substitutions: buildKebabCaseNameSubstitutions(nameKebabCase),
            templateDirectoryPath: path.join(
              process.cwd(),
              NESTJS_DATALOADER_MODULE_TEMPLATE_DIRECTORY_PATH,
            ),
          };
        },
      },
    );
  }
  /**
   * Delegates generation to the dataloader-module scaffold factory.
   */
  protected override async generate(
    argumentsOrTree: GeneratorInvocationArguments<NestjsDataloaderModuleOptions>,
  ): Promise<GeneratorCallback> {
    return NestjsDataloaderModuleCommand.generateNestjsDataloaderModule(
      argumentsOrTree,
    );
  }
}
