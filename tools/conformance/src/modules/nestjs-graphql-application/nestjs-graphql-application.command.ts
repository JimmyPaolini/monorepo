import path from "node:path";

import { Injectable } from "@nestjs/common";
import { Command } from "nest-commander";

import { APPLICATIONS_DIRECTORY } from "../../constants";
import {
  buildKebabCaseNameSubstitutions,
  type GeneratorInvocationArguments,
  normalizeGeneratorInvocationFromTree,
} from "../../utilities";
import { GeneratorTemplateService } from "../generator/generator-template.service";
import { NameGeneratorCommandRunner } from "../generator/name-generator-command-runner.service";
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
export class NestjsGraphqlApplicationCommand extends NameGeneratorCommandRunner<NestjsGraphqlApplicationOptions> {
  // 🏗 Dependency Injection

  constructor(logger: LoggerService) {
    super(logger);
    logger.setContext(NestjsGraphqlApplicationCommand.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  protected readonly successMessage =
    "Generated NestJS GraphQL application scaffold.";

  // 🔏 Private Methods

  /**
   * Migrated core generator logic for creating a NestJS GraphQL application.
   */
  static async generateNestjsGraphqlApplication(
    workspaceTree: Tree,
    generatorOptions: Partial<NestjsGraphqlApplicationOptions> = {},
  ): Promise<void> {
    const resolvedArguments =
      normalizeGeneratorInvocationFromTree<NestjsGraphqlApplicationOptions>({
        options: generatorOptions,
        tree: workspaceTree,
      });

    await GeneratorTemplateService.generateTreeTemplateScaffoldWithOptionalName<NestjsGraphqlApplicationOptions>(
      {
        argumentsOrTree: resolvedArguments,
        nameMessage: NESTJS_GRAPHQL_APPLICATION_NAME_PROMPT,
        nameSubject: "Application name",
        resolveGenerationWithName: ({ nameKebabCase, tree }) => {
          const projectRoot = path.join(APPLICATIONS_DIRECTORY, nameKebabCase);

          if (tree.exists(projectRoot)) {
            throw new Error(
              `Directory "${projectRoot}" already exists. Choose a different application name.`,
            );
          }

          return {
            instanceDirectoryPath: projectRoot,
            substitutions: buildKebabCaseNameSubstitutions(nameKebabCase),
            templateDirectoryPath: path.join(
              process.cwd(),
              "tools/conformance/src/modules/nestjs-graphql-application/templates",
            ),
          };
        },
      },
    );
  }

  // 🌎 Public Methods

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

  /**
   * Delegates generation to the NestJS GraphQL application scaffold factory.
   */
  protected override async generate(
    argumentsOrTree: GeneratorInvocationArguments<NestjsGraphqlApplicationOptions>,
  ): Promise<undefined> {
    await NestjsGraphqlApplicationCommand.generateNestjsGraphqlApplicationFromArguments(
      argumentsOrTree,
    );
    return undefined;
  }
}
