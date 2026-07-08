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
  NESTJS_GRAPHQL_MODULE_NAME_PROMPT,
  NESTJS_GRAPHQL_MODULE_PROJECT_PROMPT,
  NESTJS_GRAPHQL_MODULE_PROJECT_TAG,
} from "./nestjs-graphql-module.constants";

import type {
  NestjsGraphqlModuleArguments,
  NestjsGraphqlModuleOptions,
} from "./nestjs-graphql-module.types";
import type { GeneratorCallback, Tree } from "@nx/devkit";

/**
 * Generates a NestJS GraphQL module scaffold from templates.
 */
@Command({
  description: "Generate a NestJS GraphQL module scaffold",
  name: "nestjs-graphql-module",
})
@Injectable()
export class NestjsGraphqlModuleCommand extends ModuleGeneratorCommandRunner<NestjsGraphqlModuleOptions> {
  // 🏗 Dependency Injection

  constructor(logger: LoggerService) {
    super(logger);
    logger.setContext(NestjsGraphqlModuleCommand.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  protected readonly successMessage =
    "Generated NestJS GraphQL module scaffold.";

  // 🔏 Private Methods

  // 🌎 Public Methods

  /**
   * Migrated core generator logic for creating a NestJS GraphQL module.
   */
  static async generateNestjsGraphqlModule(
    workspaceTree: Tree,
    generatorOptions: Partial<NestjsGraphqlModuleOptions> = {},
  ): Promise<GeneratorCallback> {
    const resolvedArguments =
      normalizeGeneratorInvocationFromTree<NestjsGraphqlModuleOptions>({
        options: generatorOptions,
        tree: workspaceTree,
      });

    return GeneratorRunnerService.generateCallbackTemplateScaffoldWithProjectAndName<NestjsGraphqlModuleOptions>(
      {
        argumentsOrTree: resolvedArguments,
        nameMessage: NESTJS_GRAPHQL_MODULE_NAME_PROMPT,
        nameSubject: "Module name",
        projectMessage: NESTJS_GRAPHQL_MODULE_PROJECT_PROMPT,
        projectTag: NESTJS_GRAPHQL_MODULE_PROJECT_TAG,
        resolveGenerationWithProjectAndName: ({
          nameKebabCase,
          projectName,
          tree,
        }) => {
          const directory = resolveProjectModulesDirectoryPath({
            projectName,
            tree,
          });

          return {
            instanceDirectoryPath: path.join(directory, nameKebabCase),
            substitutions: buildKebabCaseNameSubstitutions(nameKebabCase),
            templateDirectoryPath: path.join(
              process.cwd(),
              "tools/conformance/src/modules/nestjs-graphql-module/templates",
            ),
          };
        },
      },
    );
  }

  /**
   * Converts command-runner arguments to tree-first invocation.
   */
  static async generateNestjsGraphqlModuleFromArguments(
    argumentsOrTree: NestjsGraphqlModuleArguments,
  ): Promise<GeneratorCallback> {
    const workspaceTree = argumentsOrTree.tree;
    return NestjsGraphqlModuleCommand.generateNestjsGraphqlModule(
      workspaceTree,
      argumentsOrTree.options,
    );
  }

  /**
   * Delegates generation to the GraphQL-module scaffold factory.
   */
  protected override async generate(
    argumentsOrTree: GeneratorInvocationArguments<NestjsGraphqlModuleOptions>,
  ): Promise<GeneratorCallback> {
    return NestjsGraphqlModuleCommand.generateNestjsGraphqlModuleFromArguments(
      argumentsOrTree,
    );
  }
}
