import path from "node:path";

import { Injectable } from "@nestjs/common";
import { Command } from "nest-commander";

import {
  buildKebabCaseNameSubstitutions,
  type GeneratorInvocationArguments,
  normalizeGeneratorInvocationFromTree,
  resolveProjectModulesDirectoryPath,
} from "../../utilities";
import { GeneratorRunnerService } from "../generator/generator-runner.service";
import { ModuleGeneratorCommandRunner } from "../generator/module-generator-command-runner.service";
import { LoggerService } from "../logger/logger.service";

import {
  NESTJS_COMMAND_MODULE_NAME_PROMPT,
  NESTJS_COMMAND_MODULE_PROJECT_PROMPT,
  NESTJS_COMMAND_MODULE_PROJECT_TAG,
  NESTJS_COMMAND_MODULE_TEMPLATE_DIRECTORY_PATH,
} from "./nestjs-command-module.constants";

import type {
  NestjsCommandModuleArguments,
  NestjsCommandModuleOptions,
} from "./nestjs-command-module.types";
import type { GeneratorCallback, Tree } from "@nx/devkit";

/**
 * Generates a NestJS command module scaffold from templates.
 */
@Command({
  description: "Generate a NestJS command module scaffold",
  name: "nestjs-command-module",
})
@Injectable()
export class NestjsCommandModuleCommand extends ModuleGeneratorCommandRunner<NestjsCommandModuleOptions> {
  // 🏗 Dependency Injection

  constructor(logger: LoggerService) {
    super(logger);
    logger.setContext(NestjsCommandModuleCommand.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  protected readonly successMessage =
    "Generated NestJS command module scaffold.";

  // 🔏 Private Methods

  /**
   * Migrated core generator logic for creating a NestJS command module.
   */
  // 🌎 Public Methods

  static async generateNestjsCommandModule(
    workspaceTree: Tree,
    generatorOptions: Partial<NestjsCommandModuleOptions> = {},
  ): Promise<GeneratorCallback> {
    const resolvedArguments =
      normalizeGeneratorInvocationFromTree<NestjsCommandModuleOptions>({
        options: generatorOptions,
        tree: workspaceTree,
      });

    return GeneratorRunnerService.generateCallbackTemplateScaffoldWithProjectAndName<NestjsCommandModuleOptions>(
      {
        argumentsOrTree: resolvedArguments,
        nameMessage: NESTJS_COMMAND_MODULE_NAME_PROMPT,
        nameSubject: "Module name",
        projectMessage: NESTJS_COMMAND_MODULE_PROJECT_PROMPT,
        projectTag: NESTJS_COMMAND_MODULE_PROJECT_TAG,
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
              NESTJS_COMMAND_MODULE_TEMPLATE_DIRECTORY_PATH,
            ),
          };
        },
      },
    );
  }

  /**
   * Converts command-runner arguments to tree-first invocation.
   */
  static async generateNestjsCommandModuleFromArguments(
    argumentsOrTree: NestjsCommandModuleArguments,
  ): Promise<GeneratorCallback> {
    const workspaceTree = argumentsOrTree.tree;
    return NestjsCommandModuleCommand.generateNestjsCommandModule(
      workspaceTree,
      argumentsOrTree.options,
    );
  }
  /**
   * Delegates generation to the command-module scaffold factory.
   */
  protected override async generate(
    argumentsOrTree: GeneratorInvocationArguments<NestjsCommandModuleOptions>,
  ): Promise<GeneratorCallback> {
    return NestjsCommandModuleCommand.generateNestjsCommandModuleFromArguments(
      argumentsOrTree,
    );
  }
}
