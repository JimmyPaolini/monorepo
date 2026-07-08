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
  NESTJS_SERVICE_MODULE_NAME_PROMPT,
  NESTJS_SERVICE_MODULE_PROJECT_PROMPT,
  NESTJS_SERVICE_MODULE_PROJECT_TAG,
} from "./nestjs-service-module.constants";

import type {
  NestjsServiceModuleArguments,
  NestjsServiceModuleOptions,
} from "./nestjs-service-module.types";
import type { GeneratorCallback, Tree } from "@nx/devkit";

/**
 * Generates a NestJS service module scaffold from templates.
 */
@Command({
  description: "Generate a NestJS service module scaffold",
  name: "nestjs-service-module",
})
@Injectable()
export class NestjsServiceModuleCommand extends ModuleGeneratorCommandRunner<NestjsServiceModuleOptions> {
  // 🏗 Dependency Injection

  constructor(logger: LoggerService) {
    super(logger);
    logger.setContext(NestjsServiceModuleCommand.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  protected readonly successMessage =
    "Generated NestJS service module scaffold.";

  // 🔏 Private Methods

  /**
   * Migrated core generator logic for creating a NestJS service module.
   */
  // 🌎 Public Methods

  static async generateNestjsServiceModule(
    workspaceTree: Tree,
    generatorOptions: Partial<NestjsServiceModuleOptions> = {},
  ): Promise<GeneratorCallback> {
    const resolvedArguments =
      normalizeGeneratorInvocationFromTree<NestjsServiceModuleOptions>({
        options: generatorOptions,
        tree: workspaceTree,
      });

    return GeneratorRunnerService.generateCallbackTemplateScaffoldWithProjectAndName<NestjsServiceModuleOptions>(
      {
        argumentsOrTree: resolvedArguments,
        nameMessage: NESTJS_SERVICE_MODULE_NAME_PROMPT,
        nameSubject: "Module name",
        projectMessage: NESTJS_SERVICE_MODULE_PROJECT_PROMPT,
        projectTag: NESTJS_SERVICE_MODULE_PROJECT_TAG,
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
              "tools/conformance/src/modules/nestjs-service-module/templates",
            ),
          };
        },
      },
    );
  }

  /**
   * Converts command-runner arguments to tree-first invocation.
   */
  static async generateNestjsServiceModuleFromArguments(
    argumentsOrTree: NestjsServiceModuleArguments,
  ): Promise<GeneratorCallback> {
    const workspaceTree = argumentsOrTree.tree;
    return NestjsServiceModuleCommand.generateNestjsServiceModule(
      workspaceTree,
      argumentsOrTree.options,
    );
  }
  /**
   * Delegates generation to the service-module scaffold factory.
   */
  protected override async generate(
    argumentsOrTree: GeneratorInvocationArguments<NestjsServiceModuleOptions>,
  ): Promise<GeneratorCallback> {
    return NestjsServiceModuleCommand.generateNestjsServiceModuleFromArguments(
      argumentsOrTree,
    );
  }
}
