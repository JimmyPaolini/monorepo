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
export class NestjsServiceModuleCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(private readonly logger: LoggerService) {
    super();
    this.logger.setContext(NestjsServiceModuleCommand.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  protected readonly successMessage =
    "Generated NestJS service module scaffold.";

  /**
   * Generates a NestJS service module scaffold from validated command options.
   */
  static async generateNestjsServiceModule(
    workspaceTree: Tree,
    generatorOptions: Partial<NestjsServiceModuleOptions> = {},
  ): Promise<GeneratorCallback> {
    const { options: resolvedOptions, tree } =
      normalizeGeneratorInvocationFromTree<NestjsServiceModuleOptions>({
        options: generatorOptions,
        tree: workspaceTree,
      });
    const { nameKebabCase, projectName } = await resolveProjectAndKebabCaseName(
      {
        nameMessage: NESTJS_SERVICE_MODULE_NAME_PROMPT,
        nameSubject: "Module name",
        projectMessage: NESTJS_SERVICE_MODULE_PROJECT_PROMPT,
        projectTag: NESTJS_SERVICE_MODULE_PROJECT_TAG,
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
        "tools/conformance/src/modules/nestjs-service-module/templates",
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
   * Migrated core generator logic for creating a NestJS service module.
   */
  // 🌎 Public Methods

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
   * Normalizes raw command options into the typed command option shape.
   */
  private static normalizeCommandOptions(
    options: Record<string, unknown> | undefined,
  ): NestjsServiceModuleOptions {
    const normalizedOptions: NestjsServiceModuleOptions = {};

    if (typeof options?.["name"] === "string") {
      normalizedOptions.name = options["name"];
    }

    if (typeof options?.["project"] === "string") {
      normalizedOptions.project = options["project"];
    }

    return normalizedOptions;
  }
  /**
   * Delegates generation to the service-module scaffold factory.
   */
  protected async generate(
    argumentsOrTree: GeneratorInvocationArguments<NestjsServiceModuleOptions>,
  ): Promise<GeneratorCallback> {
    return NestjsServiceModuleCommand.generateNestjsServiceModule(
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
      NestjsServiceModuleCommand.normalizeCommandOptions(options);

    await runGeneratorCommandWithCallback({
      generate: async (argumentsOrTree) => this.generate(argumentsOrTree),
      logger: this.logger,
      options: parsedOptions,
      successMessage: this.successMessage,
    });
  }
}
