import path from "node:path";

import { Injectable } from "@nestjs/common";
import { formatFiles } from "@nx/devkit";
import _ from "lodash";
import { Command, CommandRunner, Option } from "nest-commander";
import prompts from "prompts";

import { APPLICATIONS_DIRECTORY, DESTINATION_ROOTS } from "../../constants";
import { StringCase } from "../../types";
import {
  commitWorkspaceTree,
  createWorkspaceTree,
  generateFiles,
  isGeneratorInvocationArguments,
  normalizeGeneratorInvocationFromArguments,
  normalizeGeneratorInvocationFromTree,
  resolveName,
} from "../../utilities";
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
export class NestjsCommandApplicationCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(private readonly logger: LoggerService) {
    super();
    (this.logger as LoggerService | undefined)?.setContext(
      NestjsCommandApplicationCommand.name,
    );
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

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
    const { options: resolvedOptions, tree } = resolvedArguments;
    const nameKebabCase = await resolveName({
      case: StringCase.KEBAB_CASE,
      message: NESTJS_COMMAND_APPLICATION_NAME_PROMPT,
      ...(resolvedOptions.name !== undefined && { name: resolvedOptions.name }),
      subject: "Application name",
    });

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

    const substitutions = {
      destinationRoot,
      nameCamelCase: _.camelCase(nameKebabCase),
      nameKebabCase,
      namePascalCase: _.upperFirst(_.camelCase(nameKebabCase)),
    };

    generateFiles({
      instanceDirectoryPath: projectRoot,
      substitutions,
      templateDirectoryPath: path.join(
        process.cwd(),
        "tools/conformance/src/modules/nestjs-command-application/templates",
      ),
      tree,
    });

    await formatFiles(tree);
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
   * Parses the optional destination root argument.
   */
  @Option({
    description: "Destination root (for example applications or tools)",
    flags: "-d, --destination-root [destinationRoot]",
  })
  parseDestinationRootOption(value: string): string {
    return value;
  }

  /**
   * Parses the optional application name argument.
   */
  @Option({
    description: "Application name in kebab-case",
    flags: "-n, --name [name]",
  })
  parseNameOption(value: string): string {
    return value;
  }

  /**
   * Runs generator logic using CLI options and writes generated files to disk.
   */
  async run(
    _passedParameters: string[],
    options: NestjsCommandApplicationOptions,
  ): Promise<void> {
    const tree = createWorkspaceTree();
    await NestjsCommandApplicationCommand.generateNestjsCommandApplication({
      options,
      tree,
    });
    await commitWorkspaceTree({ tree });
    this.logger.log("Generated NestJS command application scaffold.");
  }
}
