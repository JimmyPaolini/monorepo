import path from "node:path";

import { Injectable } from "@nestjs/common";
import { Command, Option } from "nest-commander";
import prompts from "prompts";

import {
  buildKebabCaseNameSubstitutions,
  type GeneratorInvocationArguments,
  isGeneratorInvocationArguments,
  normalizeGeneratorInvocationFromArguments,
  normalizeGeneratorInvocationFromTree,
  parseStringCommandOption,
  resolveProjectModulesDirectoryPath,
} from "../../utilities";
import { GeneratorRunnerService } from "../generator/generator-runner.service";
import { ModuleGeneratorCommandRunner } from "../generator/module-generator-command-runner.service";
import { LoggerService } from "../logger/logger.service";

import {
  NESTJS_SERVICE_FILE_MODULE_PROMPT,
  NESTJS_SERVICE_FILE_NAME_PROMPT,
  NESTJS_SERVICE_FILE_PROJECT_PROMPT,
  NESTJS_SERVICE_FILE_PROJECT_TAG,
  NESTJS_SERVICE_FILE_TEMPLATE_DIRECTORY_PATH,
} from "./nestjs-service-file.constants";

import type {
  NestjsServiceFileArguments,
  NestjsServiceFileOptions,
} from "./nestjs-service-file.types";
import type { GeneratorCallback, Tree } from "@nx/devkit";
import type { Choice, PromptObject } from "prompts";

/**
 * Generates NestJS service files from templates.
 */
@Command({
  description: "Generate NestJS service files",
  name: "nestjs-service-file",
})
@Injectable()
export class NestjsServiceFileCommand extends ModuleGeneratorCommandRunner<NestjsServiceFileOptions> {
  // 🏗 Dependency Injection

  constructor(logger: LoggerService) {
    super(logger);
    logger.setContext(NestjsServiceFileCommand.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  protected readonly successMessage = "Generated NestJS service files.";

  // 🔏 Private Methods

  /**
   * Migrated core generator logic for creating NestJS service files.
   */
  static async generateNestjsServiceFile(
    argumentsOrTree: NestjsServiceFileArguments,
  ): Promise<GeneratorCallback>;
  /**
   * Overload signature for tree and options based invocation.
   */
  static async generateNestjsServiceFile(
    tree: Tree,
    options?: NestjsServiceFileOptions,
  ): Promise<GeneratorCallback>;
  /**
   * Overload signature for tree and options based invocation.
   */
  static async generateNestjsServiceFile(
    argumentsOrTree: NestjsServiceFileArguments | Tree,
    resolvedOptions?: NestjsServiceFileOptions,
  ): Promise<GeneratorCallback> {
    const resolvedArguments =
      isGeneratorInvocationArguments<NestjsServiceFileOptions>(argumentsOrTree)
        ? normalizeGeneratorInvocationFromArguments<NestjsServiceFileOptions>(
            argumentsOrTree,
          )
        : normalizeGeneratorInvocationFromTree<NestjsServiceFileOptions>({
            ...(resolvedOptions !== undefined && { options: resolvedOptions }),
            tree: argumentsOrTree,
          });

    return GeneratorRunnerService.generateCallbackTemplateScaffoldWithProjectAndName<NestjsServiceFileOptions>(
      {
        argumentsOrTree: resolvedArguments,
        nameMessage: NESTJS_SERVICE_FILE_NAME_PROMPT,
        nameSubject: "Service name",
        projectMessage: NESTJS_SERVICE_FILE_PROJECT_PROMPT,
        projectTag: NESTJS_SERVICE_FILE_PROJECT_TAG,
        resolveGenerationWithProjectAndName: async ({
          nameKebabCase,
          options,
          projectName,
          tree,
        }) => {
          const moduleName = await NestjsServiceFileCommand.resolveModuleName({
            message: NESTJS_SERVICE_FILE_MODULE_PROMPT,
            modulesDirectoryPath: resolveProjectModulesDirectoryPath({
              projectName,
              tree,
            }),
            tree,
            ...(options.module !== undefined && { module: options.module }),
          });
          const modulesDirectory = resolveProjectModulesDirectoryPath({
            projectName,
            tree,
          });

          return {
            instanceDirectoryPath: path.join(modulesDirectory, moduleName),
            substitutions: buildKebabCaseNameSubstitutions(nameKebabCase),
            templateDirectoryPath: path.join(
              process.cwd(),
              NESTJS_SERVICE_FILE_TEMPLATE_DIRECTORY_PATH,
            ),
          };
        },
      },
    );
  }

  // 🌎 Public Methods

  /**
   * Prompts the user to select a target module when one is not provided.
   */
  private static async promptModuleSelection(args: {
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
  private static async resolveModuleName(args: {
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
          tree.children(path.join(modulesDirectoryPath, childNodeName)).length >
          0
        );
      });

    if (availableModules.length === 0) {
      throw new Error(
        `No modules found in "${modulesDirectoryPath}". Create a module first before generating service files.`,
      );
    }

    const moduleName =
      module ??
      (await NestjsServiceFileCommand.promptModuleSelection({
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
   * Delegates generation to the NestJS service-file scaffold factory.
   */
  protected override async generate(
    argumentsOrTree: GeneratorInvocationArguments<NestjsServiceFileOptions>,
  ): Promise<GeneratorCallback> {
    return NestjsServiceFileCommand.generateNestjsServiceFile(argumentsOrTree);
  }

  /**
   * Parses the optional module name argument.
   */
  @Option({
    description: "Target module name in kebab-case",
    flags: "-m, --module [module]",
  })
  parseModuleOption(value: string): string {
    return parseStringCommandOption(value);
  }

  /**
   * Parses the optional service name argument.
   */
  @Option({
    description: "Service name in kebab-case",
    flags: "-n, --name [name]",
  })
  override parseNameOption(value: string): string {
    return parseStringCommandOption(value);
  }
}
