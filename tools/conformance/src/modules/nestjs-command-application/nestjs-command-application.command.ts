import path from "node:path";

import { Injectable } from "@nestjs/common";
import { Command, Option } from "nest-commander";
import prompts from "prompts";

import { APPLICATIONS_DIRECTORY, DESTINATION_ROOTS } from "../../constants";
import {
  buildKebabCaseNameSubstitutions,
  type GeneratorInvocationArguments,
  isGeneratorInvocationArguments,
  normalizeGeneratorInvocationFromArguments,
  normalizeGeneratorInvocationFromTree,
  parseStringCommandOption,
} from "../../utilities";
import { GeneratorTemplateService } from "../generator/generator-template.service";
import { NameGeneratorCommandRunner } from "../generator/name-generator-command-runner.service";
import { LoggerService } from "../logger/logger.service";

import {
  NESTJS_COMMAND_APPLICATION_DESTINATION_ROOT_PROMPT,
  NESTJS_COMMAND_APPLICATION_NAME_PROMPT,
} from "./nestjs-command-application.constants";

import type {
  NestjsCommandApplicationArguments,
  NestjsCommandApplicationOptions,
} from "./nestjs-command-application.types";
import type { Tree } from "@nx/devkit";
import type { Choice, PromptObject } from "prompts";

/**
 * Generates a NestJS command application scaffold from templates.
 */
@Command({
  description: "Generate a NestJS command application scaffold",
  name: "nestjs-command-application",
})
@Injectable()
export class NestjsCommandApplicationCommand extends NameGeneratorCommandRunner<NestjsCommandApplicationOptions> {
  // 🏗 Dependency Injection

  constructor(logger: LoggerService) {
    super(logger);
    logger.setContext(NestjsCommandApplicationCommand.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  protected readonly successMessage =
    "Generated NestJS command application scaffold.";

  // 🔏 Private Methods

  /**
   * Migrated core generator logic for creating a NestJS command application.
   */
  static async generateNestjsCommandApplication(
    argumentsOrTree: NestjsCommandApplicationArguments,
  ): Promise<void>;
  /**
   * Overload signature for tree and options based invocation.
   */
  static async generateNestjsCommandApplication(
    tree: Tree,
    options?: NestjsCommandApplicationOptions,
  ): Promise<void>;
  /**
   * Overload signature for tree and options based invocation.
   */
  static async generateNestjsCommandApplication(
    argumentsOrTree: NestjsCommandApplicationArguments | Tree,
    options?: NestjsCommandApplicationOptions,
  ): Promise<void> {
    const resolvedArguments =
      isGeneratorInvocationArguments<NestjsCommandApplicationOptions>(
        argumentsOrTree,
      )
        ? normalizeGeneratorInvocationFromArguments<NestjsCommandApplicationOptions>(
            argumentsOrTree,
          )
        : normalizeGeneratorInvocationFromTree<NestjsCommandApplicationOptions>(
            {
              ...(options !== undefined && { options }),
              tree: argumentsOrTree,
            },
          );

    await GeneratorTemplateService.generateTreeTemplateScaffoldWithOptionalName<NestjsCommandApplicationOptions>(
      {
        argumentsOrTree: resolvedArguments,
        nameMessage: NESTJS_COMMAND_APPLICATION_NAME_PROMPT,
        nameSubject: "Application name",
        resolveGenerationWithName: async ({
          nameKebabCase,
          options: resolvedOptions,
          tree,
        }) => {
          const destinationRoot =
            await NestjsCommandApplicationCommand.resolveDestinationRoot({
              message: NESTJS_COMMAND_APPLICATION_DESTINATION_ROOT_PROMPT,
              ...(resolvedOptions.destinationRoot !== undefined && {
                destinationRoot: resolvedOptions.destinationRoot,
              }),
            });

          const projectRoot = path.join(destinationRoot, nameKebabCase);

          if (tree.exists(projectRoot)) {
            throw new Error(
              `Directory "${projectRoot}" already exists. Choose a different application name.`,
            );
          }

          return {
            instanceDirectoryPath: projectRoot,
            substitutions: {
              ...buildKebabCaseNameSubstitutions(nameKebabCase),
              destinationRoot,
            },
            templateDirectoryPath: path.join(
              process.cwd(),
              "tools/conformance/src/modules/nestjs-command-application/templates",
            ),
          };
        },
      },
    );
  }

  // 🌎 Public Methods

  /**
   * Returns whether the value is a valid destination root.
   */
  private static isDestinationRoot(value: string): boolean {
    const destinationRoots: readonly string[] = DESTINATION_ROOTS;
    return destinationRoots.includes(value);
  }
  /**
   * Prompts for destination root selection.
   */
  private static async promptDestinationRoot(): Promise<string> {
    const request: PromptObject<"destinationRoot"> = {
      choices: DESTINATION_ROOTS.map(
        (value): Choice => ({ title: value, value }),
      ),
      initial: DESTINATION_ROOTS.indexOf(APPLICATIONS_DIRECTORY),
      message: NESTJS_COMMAND_APPLICATION_DESTINATION_ROOT_PROMPT,
      name: "destinationRoot",
      type: "select",
    };
    const response: { destinationRoot: string | undefined } =
      await prompts(request);

    if (!response.destinationRoot) {
      throw new Error("No destination root selected");
    }

    return response.destinationRoot;
  }
  /**
   * Resolves the destination root for generated command applications.
   */
  private static async resolveDestinationRoot(args: {
    destinationRoot?: string;
    message: string;
  }): Promise<string> {
    const destinationRoot =
      args.destinationRoot ??
      (await NestjsCommandApplicationCommand.promptDestinationRoot());

    if (!NestjsCommandApplicationCommand.isDestinationRoot(destinationRoot)) {
      throw new Error(
        `Destination root "${destinationRoot}" is not valid. Allowed values: ${DESTINATION_ROOTS.join(", ")}`,
      );
    }

    return destinationRoot;
  }

  /**
   * Delegates generation to the NestJS command application scaffold factory.
   */
  protected override async generate(
    argumentsOrTree: GeneratorInvocationArguments<NestjsCommandApplicationOptions>,
  ): Promise<undefined> {
    await NestjsCommandApplicationCommand.generateNestjsCommandApplication(
      argumentsOrTree,
    );
    return undefined;
  }

  /**
   * Parses the optional destination root argument.
   */
  @Option({
    description: "Destination root (for example applications or tools)",
    flags: "-d, --destination-root [destinationRoot]",
  })
  parseDestinationRootOption(value: string): string {
    return parseStringCommandOption(value);
  }
}
