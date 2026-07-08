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
export class NestjsGraphqlModuleCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(private readonly logger: LoggerService) {
    super();
    this.logger.setContext(NestjsGraphqlModuleCommand.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  protected readonly successMessage =
    "Generated NestJS GraphQL module scaffold.";

  /**
   * Migrated core generator logic for creating a NestJS GraphQL module.
   */
  static async generateNestjsGraphqlModule(
    workspaceTree: Tree,
    generatorOptions: Partial<NestjsGraphqlModuleOptions> = {},
  ): Promise<GeneratorCallback> {
    const { options: resolvedOptions, tree } =
      normalizeGeneratorInvocationFromTree<NestjsGraphqlModuleOptions>({
        options: generatorOptions,
        tree: workspaceTree,
      });
    const { nameKebabCase, projectName } = await resolveProjectAndKebabCaseName(
      {
        nameMessage: NESTJS_GRAPHQL_MODULE_NAME_PROMPT,
        nameSubject: "Module name",
        projectMessage: NESTJS_GRAPHQL_MODULE_PROJECT_PROMPT,
        projectTag: NESTJS_GRAPHQL_MODULE_PROJECT_TAG,
        tree,
        ...(resolvedOptions.name !== undefined && {
          name: resolvedOptions.name,
        }),
        ...(resolvedOptions.project !== undefined && {
          optionsProject: resolvedOptions.project,
        }),
      },
    );
    const directory = resolveProjectModulesDirectoryPath({
      projectName,
      tree,
    });

    const targetPath = path.join(directory, nameKebabCase);
    generateFiles({
      instanceDirectoryPath: targetPath,
      substitutions: buildKebabCaseNameSubstitutions(nameKebabCase),
      templateDirectoryPath: path.join(
        process.cwd(),
        "tools/conformance/src/modules/nestjs-graphql-module/templates",
      ),
      tree,
    });

    return createFormatFilesCallback({
      targetPath,
      tree,
    });
  }

  // 🔏 Private Methods

  // 🌎 Public Methods

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
   * Normalizes raw command options into the typed command option shape.
   */
  private static normalizeCommandOptions(
    options: Record<string, unknown> | undefined,
  ): NestjsGraphqlModuleOptions {
    const normalizedOptions: NestjsGraphqlModuleOptions = {};

    if (typeof options?.["name"] === "string") {
      normalizedOptions.name = options["name"];
    }

    if (typeof options?.["project"] === "string") {
      normalizedOptions.project = options["project"];
    }

    return normalizedOptions;
  }

  /**
   * Delegates generation to the GraphQL-module scaffold factory.
   */
  protected async generate(
    argumentsOrTree: GeneratorInvocationArguments<NestjsGraphqlModuleOptions>,
  ): Promise<GeneratorCallback> {
    return NestjsGraphqlModuleCommand.generateNestjsGraphqlModule(
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
      NestjsGraphqlModuleCommand.normalizeCommandOptions(options);

    await runGeneratorCommandWithCallback({
      generate: async (argumentsOrTree) => this.generate(argumentsOrTree),
      logger: this.logger,
      options: parsedOptions,
      successMessage: this.successMessage,
    });
  }
}
