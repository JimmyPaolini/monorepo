import path from "node:path";

import { Injectable } from "@nestjs/common";
import { Command, CommandRunner, Option } from "nest-commander";
import prompts from "prompts";

import {
  buildKebabCaseNameSubstitutions,
  createFormatFilesCallback,
  generateFiles,
  type GeneratorInvocationArguments,
  normalizeGeneratorInvocationFromTree,
  resolveProjectAndKebabCaseName,
  resolveProjectModulesDirectoryPath,
  runGeneratorCommandWithCallback,
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
    this.logger.setContext(NestjsServiceFileCommand.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  protected readonly successMessage = "Generated NestJS service files.";

  /**
   * Migrated core generator logic for creating NestJS service files.
   */
  static async generateNestjsServiceFile(
    workspaceTree: Tree,
    generatorOptions: Partial<NestjsServiceFileOptions> = {},
  ): Promise<GeneratorCallback> {
    const { options: resolvedOptions, tree } =
      normalizeGeneratorInvocationFromTree<NestjsServiceFileOptions>({
        options: generatorOptions,
        tree: workspaceTree,
      });
    const { nameKebabCase, projectName } = await resolveProjectAndKebabCaseName(
      {
        nameMessage: NESTJS_SERVICE_FILE_NAME_PROMPT,
        nameSubject: "Service name",
        projectMessage: NESTJS_SERVICE_FILE_PROJECT_PROMPT,
        projectTag: NESTJS_SERVICE_FILE_PROJECT_TAG,
        tree,
        ...(resolvedOptions.name !== undefined && {
          name: resolvedOptions.name,
        }),
        ...(resolvedOptions.project !== undefined && {
          optionsProject: resolvedOptions.project,
        }),
      },
    );
    const modulesDirectory = resolveProjectModulesDirectoryPath({
      projectName,
      tree,
    });
    const moduleName = await NestjsServiceFileCommand.resolveModuleName({
      message: NESTJS_SERVICE_FILE_MODULE_PROMPT,
      modulesDirectoryPath: modulesDirectory,
      tree,
      ...(resolvedOptions.module !== undefined && {
        module: resolvedOptions.module,
      }),
    });

    const targetPath = path.join(modulesDirectory, moduleName);
    generateFiles({
      instanceDirectoryPath: targetPath,
      substitutions: buildKebabCaseNameSubstitutions(nameKebabCase),
      templateDirectoryPath: path.join(
        process.cwd(),
        NESTJS_SERVICE_FILE_TEMPLATE_DIRECTORY_PATH,
      ),
      tree,
    });

    return createFormatFilesCallback({
      targetPath,
      tree,
    });
  }

  // 🔏 Private Methods

  /**
   * Converts command-runner arguments to tree-first invocation.
   */
  static async generateNestjsServiceFileFromArguments(
    argumentsOrTree: NestjsServiceFileArguments,
  ): Promise<GeneratorCallback> {
    const workspaceTree = argumentsOrTree.tree;
    return NestjsServiceFileCommand.generateNestjsServiceFile(
      workspaceTree,
      argumentsOrTree.options,
    );
  }

  /**
   * Normalizes raw command options into the typed command option shape.
   */
  private static normalizeCommandOptions(
    options: Record<string, unknown> | undefined,
  ): NestjsServiceFileOptions {
    const normalizedOptions: NestjsServiceFileOptions = {};

    if (typeof options?.["module"] === "string") {
      normalizedOptions.module = options["module"];
    }

    if (typeof options?.["name"] === "string") {
      normalizedOptions.name = options["name"];
    }

    if (typeof options?.["project"] === "string") {
      normalizedOptions.project = options["project"];
    }

    return normalizedOptions;
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
  protected async generate(
    argumentsOrTree: GeneratorInvocationArguments<NestjsServiceFileOptions>,
  ): Promise<GeneratorCallback> {
    return NestjsServiceFileCommand.generateNestjsServiceFile(
      argumentsOrTree.tree,
      argumentsOrTree.options,
    );
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
   * Parses the optional parent project argument.
   */
  @Option({
    description: "Parent project name in kebab-case",
    flags: "-p, --project [project]",
  })
  parseProjectOption(value: string): string {
    return value;
  }

  /**
   * Runs generator command orchestration and logs success output.
   */
  async run(
    _passedParameters: string[],
    options?: Record<string, unknown>,
  ): Promise<void> {
    const parsedOptions =
      NestjsServiceFileCommand.normalizeCommandOptions(options);

    await runGeneratorCommandWithCallback({
      generate: async (argumentsOrTree) => this.generate(argumentsOrTree),
      logger: this.logger,
      options: parsedOptions,
      successMessage: this.successMessage,
    });
  }
}
