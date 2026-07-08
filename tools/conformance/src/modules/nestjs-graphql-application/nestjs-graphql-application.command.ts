import path from "node:path";

import { Injectable } from "@nestjs/common";
import { Command, CommandRunner, Option } from "nest-commander";

import { APPLICATIONS_DIRECTORY } from "../../constants";
import {
  buildKebabCaseNameSubstitutions,
  formatTemplateScaffoldTree,
  type GeneratorInvocationArguments,
  normalizeGeneratorInvocationFromTree,
  resolveOptionalKebabCaseName,
  runGeneratorCommandWithCallback,
} from "../../utilities";
import { LoggerService } from "../logger/logger.service";

import { NESTJS_GRAPHQL_APPLICATION_NAME_PROMPT } from "./nestjs-graphql-application.constants";

import type {
  NestjsGraphqlApplicationArguments,
  NestjsGraphqlApplicationOptions,
} from "./nestjs-graphql-application.types";
import type { Tree } from "@nx/devkit";

/**
 * Generates a NestJS GraphQL application scaffold from templates.
 */
@Command({
  description: "Generate a NestJS GraphQL application scaffold",
  name: "nestjs-graphql-application",
})
@Injectable()
export class NestjsGraphqlApplicationCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(private readonly logger: LoggerService) {
    super();
    this.logger.setContext(NestjsGraphqlApplicationCommand.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  protected readonly successMessage =
    "Generated NestJS GraphQL application scaffold.";

  /**
   * Migrated core generator logic for creating a NestJS GraphQL application.
   */
  static async generateNestjsGraphqlApplication(
    workspaceTree: Tree,
    generatorOptions: Partial<NestjsGraphqlApplicationOptions> = {},
  ): Promise<void> {
    const { options: resolvedOptions, tree } =
      normalizeGeneratorInvocationFromTree<NestjsGraphqlApplicationOptions>({
        options: generatorOptions,
        tree: workspaceTree,
      });
    const nameKebabCase = await resolveOptionalKebabCaseName({
      message: NESTJS_GRAPHQL_APPLICATION_NAME_PROMPT,
      ...(resolvedOptions.name !== undefined && {
        name: resolvedOptions.name,
      }),
      subject: "Application name",
    });
    const projectRoot = path.join(APPLICATIONS_DIRECTORY, nameKebabCase);

    if (tree.exists(projectRoot)) {
      throw new Error(
        `Directory "${projectRoot}" already exists. Choose a different application name.`,
      );
    }

    await formatTemplateScaffoldTree({
      generation: {
        instanceDirectoryPath: projectRoot,
        substitutions: buildKebabCaseNameSubstitutions(nameKebabCase),
        templateDirectoryPath: path.join(
          process.cwd(),
          "tools/conformance/src/modules/nestjs-graphql-application/templates",
        ),
      },
      tree,
    });
  }

  // 🔏 Private Methods

  /**
   * Converts command-runner arguments to tree-first invocation.
   */
  static async generateNestjsGraphqlApplicationFromArguments(
    argumentsOrTree: NestjsGraphqlApplicationArguments,
  ): Promise<void> {
    const workspaceTree = argumentsOrTree.tree;
    await NestjsGraphqlApplicationCommand.generateNestjsGraphqlApplication(
      workspaceTree,
      argumentsOrTree.options,
    );
  }

  // 🌎 Public Methods

  /**
   * Normalizes raw command options into the typed command option shape.
   */
  private static normalizeCommandOptions(
    options: Record<string, unknown> | undefined,
  ): NestjsGraphqlApplicationOptions {
    const normalizedOptions: NestjsGraphqlApplicationOptions = {};

    if (typeof options?.["name"] === "string") {
      normalizedOptions.name = options["name"];
    }

    return normalizedOptions;
  }

  /**
   * Delegates generation to the NestJS GraphQL application scaffold factory.
   */
  protected async generate(
    argumentsOrTree: GeneratorInvocationArguments<NestjsGraphqlApplicationOptions>,
  ): Promise<undefined> {
    await NestjsGraphqlApplicationCommand.generateNestjsGraphqlApplication(
      argumentsOrTree.tree,
      argumentsOrTree.options,
    );
    return undefined;
  }

  /**
   * Parses the optional application name argument.
   */
  @Option({
    description: "Name in kebab-case",
    flags: "-n, --name [name]",
  })
  parseNameOption(value: string): string {
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
      NestjsGraphqlApplicationCommand.normalizeCommandOptions(options);

    await runGeneratorCommandWithCallback({
      generate: async (argumentsOrTree) => this.generate(argumentsOrTree),
      logger: this.logger,
      options: parsedOptions,
      successMessage: this.successMessage,
    });
  }
}
