import path from "node:path";

import { Injectable } from "@nestjs/common";
import { Command, CommandRunner, Option } from "nest-commander";

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
export class NestjsDataloaderModuleCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(private readonly logger: LoggerService) {
    super();
    this.logger.setContext(NestjsDataloaderModuleCommand.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  protected readonly successMessage =
    "Generated NestJS DataLoader module scaffold.";

  /**
   * Generates a NestJS DataLoader module scaffold from validated command options.
   */
  static async generateNestjsDataloaderModule(
    workspaceTree: Tree,
    generatorOptions: Partial<NestjsDataloaderModuleOptions> = {},
  ): Promise<GeneratorCallback> {
    const { options: resolvedOptions, tree } =
      normalizeGeneratorInvocationFromTree<NestjsDataloaderModuleOptions>({
        options: generatorOptions,
        tree: workspaceTree,
      });
    const { nameKebabCase, projectName } = await resolveProjectAndKebabCaseName(
      {
        nameMessage: NESTJS_DATALOADER_MODULE_NAME_PROMPT,
        nameSubject: "Module name",
        projectMessage: NESTJS_DATALOADER_MODULE_PROJECT_PROMPT,
        projectTag: NESTJS_DATALOADER_MODULE_PROJECT_TAG,
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
    const targetPath = path.join(modulesDirectory, nameKebabCase);

    generateFiles({
      instanceDirectoryPath: targetPath,
      substitutions: buildKebabCaseNameSubstitutions(nameKebabCase),
      templateDirectoryPath: path.join(
        process.cwd(),
        NESTJS_DATALOADER_MODULE_TEMPLATE_DIRECTORY_PATH,
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
   * Migrated core generator logic for creating a NestJS DataLoader module.
   */
  // 🌎 Public Methods

  /**
   * Converts command-runner arguments to tree-first invocation.
   */
  static async generateNestjsDataloaderModuleFromArguments(
    argumentsOrTree: NestjsDataloaderModuleArguments,
  ): Promise<GeneratorCallback> {
    const workspaceTree = argumentsOrTree.tree;
    return NestjsDataloaderModuleCommand.generateNestjsDataloaderModule(
      workspaceTree,
      argumentsOrTree.options,
    );
  }

  /**
   * Normalizes raw command options into the typed command option shape.
   */
  private static normalizeCommandOptions(
    options: Record<string, unknown> | undefined,
  ): NestjsDataloaderModuleOptions {
    const normalizedOptions: NestjsDataloaderModuleOptions = {};

    if (typeof options?.["name"] === "string") {
      normalizedOptions.name = options["name"];
    }

    if (typeof options?.["project"] === "string") {
      normalizedOptions.project = options["project"];
    }

    return normalizedOptions;
  }
  /**
   * Delegates generation to the dataloader-module scaffold factory.
   */
  protected async generate(
    argumentsOrTree: GeneratorInvocationArguments<NestjsDataloaderModuleOptions>,
  ): Promise<GeneratorCallback> {
    return NestjsDataloaderModuleCommand.generateNestjsDataloaderModule(
      argumentsOrTree.tree,
      argumentsOrTree.options,
    );
  }

  /**
   * Parses the optional module name argument.
   */
  @Option({
    description: "Module name in kebab-case",
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
      NestjsDataloaderModuleCommand.normalizeCommandOptions(options);

    await runGeneratorCommandWithCallback({
      generate: async (argumentsOrTree) => this.generate(argumentsOrTree),
      logger: this.logger,
      options: parsedOptions,
      successMessage: this.successMessage,
    });
  }
}
