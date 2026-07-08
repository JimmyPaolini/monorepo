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
export class NestjsCommandModuleCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(private readonly logger: LoggerService) {
    super();
    this.logger.setContext(NestjsCommandModuleCommand.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  protected readonly successMessage =
    "Generated NestJS command module scaffold.";

  /**
   * Generates a NestJS command module scaffold from validated command options.
   */
  static async generateNestjsCommandModule(
    workspaceTree: Tree,
    generatorOptions: Partial<NestjsCommandModuleOptions> = {},
  ): Promise<GeneratorCallback> {
    const { options: resolvedOptions, tree } =
      normalizeGeneratorInvocationFromTree<NestjsCommandModuleOptions>({
        options: generatorOptions,
        tree: workspaceTree,
      });
    const { nameKebabCase, projectName } = await resolveProjectAndKebabCaseName(
      {
        nameMessage: NESTJS_COMMAND_MODULE_NAME_PROMPT,
        nameSubject: "Module name",
        projectMessage: NESTJS_COMMAND_MODULE_PROJECT_PROMPT,
        projectTag: NESTJS_COMMAND_MODULE_PROJECT_TAG,
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
        NESTJS_COMMAND_MODULE_TEMPLATE_DIRECTORY_PATH,
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
   * Migrated core generator logic for creating a NestJS command module.
   */
  // 🌎 Public Methods

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
   * Normalizes raw command options into the typed command option shape.
   */
  private static normalizeCommandOptions(
    options: Record<string, unknown> | undefined,
  ): NestjsCommandModuleOptions {
    const normalizedOptions: NestjsCommandModuleOptions = {};

    if (typeof options?.["name"] === "string") {
      normalizedOptions.name = options["name"];
    }

    if (typeof options?.["project"] === "string") {
      normalizedOptions.project = options["project"];
    }

    return normalizedOptions;
  }
  /**
   * Delegates generation to the command-module scaffold factory.
   */
  protected async generate(
    argumentsOrTree: GeneratorInvocationArguments<NestjsCommandModuleOptions>,
  ): Promise<GeneratorCallback> {
    return NestjsCommandModuleCommand.generateNestjsCommandModule(
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
      NestjsCommandModuleCommand.normalizeCommandOptions(options);

    await runGeneratorCommandWithCallback({
      generate: async (argumentsOrTree) => this.generate(argumentsOrTree),
      logger: this.logger,
      options: parsedOptions,
      successMessage: this.successMessage,
    });
  }
}
