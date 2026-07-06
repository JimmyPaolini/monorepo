import path from "node:path";

import { Injectable } from "@nestjs/common";
import { Command, CommandRunner, Option } from "nest-commander";
import prompts from "prompts";

import { StringCase } from "../../types";
import {
  buildKebabCaseNameSubstitutions,
  commitWorkspaceTree,
  createFormatFilesCallback,
  createWorkspaceTree,
  generateFiles,
  isGeneratorInvocationArguments,
  normalizeGeneratorInvocationFromArguments,
  normalizeGeneratorInvocationFromTree,
  resolveName,
  resolveProject,
  resolveProjectModulesDirectoryPath,
} from "../../utilities";
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
export class NestjsServiceFileCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(private readonly logger: LoggerService) {
    super();
    (this.logger as LoggerService | undefined)?.setContext(
      NestjsServiceFileCommand.name,
    );
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

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
    options?: NestjsServiceFileOptions,
  ): Promise<GeneratorCallback> {
    const resolvedArguments =
      isGeneratorInvocationArguments<NestjsServiceFileOptions>(argumentsOrTree)
        ? normalizeGeneratorInvocationFromArguments<NestjsServiceFileOptions>(
            argumentsOrTree,
          )
        : normalizeGeneratorInvocationFromTree<NestjsServiceFileOptions>({
            ...(options !== undefined && { options }),
            tree: argumentsOrTree,
          });
    const { options: resolvedOptions, tree } = resolvedArguments;
    const { moduleName, nameKebabCase, projectName } =
      await NestjsServiceFileCommand.resolveProjectAndName(
        tree,
        resolvedOptions,
      );
    const modulesDirectory = resolveProjectModulesDirectoryPath({
      projectName,
      tree,
    });
    const targetPath = path.join(modulesDirectory, moduleName);
    const substitutions = buildKebabCaseNameSubstitutions(nameKebabCase);
    generateFiles({
      instanceDirectoryPath: targetPath,
      substitutions,
      templateDirectoryPath: path.join(
        process.cwd(),
        NESTJS_SERVICE_FILE_TEMPLATE_DIRECTORY_PATH,
      ),
      tree,
    });
    return createFormatFilesCallback({ targetPath, tree });
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
   * Resolves project, service name, and module destination for generation.
   */
  private static async resolveProjectAndName(
    tree: Tree,
    options: NestjsServiceFileOptions,
  ): Promise<{
    moduleName: string;
    nameKebabCase: string;
    projectName: string;
  }> {
    const projectName = await resolveProject({
      tag: NESTJS_SERVICE_FILE_PROJECT_TAG,
      tree,
      ...(options.project !== undefined && { project: options.project }),
      message: NESTJS_SERVICE_FILE_PROJECT_PROMPT,
    });
    const nameKebabCase = await resolveName({
      case: StringCase.KEBAB_CASE,
      message: NESTJS_SERVICE_FILE_NAME_PROMPT,
      ...(options.name !== undefined && { name: options.name }),
      subject: "Service name",
    });
    const moduleName = await NestjsServiceFileCommand.resolveModuleName({
      message: NESTJS_SERVICE_FILE_MODULE_PROMPT,
      modulesDirectoryPath: resolveProjectModulesDirectoryPath({
        projectName,
        tree,
      }),
      tree,
      ...(options.module !== undefined && { module: options.module }),
    });

    return { moduleName, nameKebabCase, projectName };
  }

  /**
   * Parses the optional module name argument.
   */
  @Option({
    description: "Target module name in kebab-case",
    flags: "-m, --module [module]",
  })
  parseModuleOption(value: string): string {
    return value;
  }

  /**
   * Parses the optional service name argument.
   */
  @Option({
    description: "Service name in kebab-case",
    flags: "-n, --name [name]",
  })
  parseNameOption(value: string): string {
    return value;
  }

  /**
   * Parses the optional project name argument.
   */
  @Option({
    description: "Parent project name in kebab-case",
    flags: "-p, --project [project]",
  })
  parseProjectOption(value: string): string {
    return value;
  }

  /**
   * Runs generator logic using CLI options and writes generated files to disk.
   */
  async run(
    _passedParameters: string[],
    options: NestjsServiceFileOptions,
  ): Promise<void> {
    const tree = createWorkspaceTree();
    const callback = await NestjsServiceFileCommand.generateNestjsServiceFile({
      options,
      tree,
    });
    await commitWorkspaceTree({ callback, tree });
    this.logger.log("Generated NestJS service files.");
  }
}
