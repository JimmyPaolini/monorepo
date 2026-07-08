import path from "node:path";

import { Injectable } from "@nestjs/common";
import { Command, CommandRunner, Option } from "nest-commander";
import prompts from "prompts";

import { APPLICATIONS_DIRECTORY, DESTINATION_ROOTS } from "../../constants";
import {
  buildKebabCaseNameSubstitutions,
  formatTemplateScaffoldTree,
  type GeneratorInvocationArguments,
  normalizeGeneratorInvocationFromTree,
  resolveOptionalKebabCaseName,
  runGeneratorCommandWithCallback,
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
    this.logger.setContext(NestjsCommandApplicationCommand.name);
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
    workspaceTree: Tree,
    generatorOptions: Partial<NestjsCommandApplicationOptions> = {},
  ): Promise<void> {
    const { options: resolvedOptions, tree } =
      normalizeGeneratorInvocationFromTree<NestjsCommandApplicationOptions>({
        options: generatorOptions,
        tree: workspaceTree,
      });
    const nameKebabCase = await resolveOptionalKebabCaseName({
      message: NESTJS_COMMAND_APPLICATION_NAME_PROMPT,
      ...(resolvedOptions.name !== undefined && {
        name: resolvedOptions.name,
      }),
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

    await formatTemplateScaffoldTree({
      generation: {
        instanceDirectoryPath: projectRoot,
        substitutions: {
          ...buildKebabCaseNameSubstitutions(nameKebabCase),
          destinationRoot,
        },
        templateDirectoryPath: path.join(
          process.cwd(),
          "tools/conformance/src/modules/nestjs-command-application/templates",
        ),
      },
      tree,
    });
  }

  /**
   * Converts command-runner arguments to tree-first invocation.
   */
  static async generateNestjsCommandApplicationFromArguments(
    argumentsOrTree: NestjsCommandApplicationArguments,
  ): Promise<void> {
    const workspaceTree = argumentsOrTree.tree;
    await NestjsCommandApplicationCommand.generateNestjsCommandApplication(
      workspaceTree,
      argumentsOrTree.options,
    );
  }

  /**
   * Returns whether the value is a valid destination root.
   */
  private static isDestinationRoot(value: string): boolean {
    const destinationRoots: readonly string[] = DESTINATION_ROOTS;
    return destinationRoots.includes(value);
  }

  // 🌎 Public Methods

  /**
   * Normalizes raw command options into the typed command option shape.
   */
  private static normalizeCommandOptions(
    options: Record<string, unknown> | undefined,
  ): NestjsCommandApplicationOptions {
    const normalizedOptions: NestjsCommandApplicationOptions = {};

    if (typeof options?.["destinationRoot"] === "string") {
      normalizedOptions.destinationRoot = options["destinationRoot"];
    }

    if (typeof options?.["name"] === "string") {
      normalizedOptions.name = options["name"];
    }

    return normalizedOptions;
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
  protected async generate(
    argumentsOrTree: GeneratorInvocationArguments<NestjsCommandApplicationOptions>,
  ): Promise<undefined> {
    await NestjsCommandApplicationCommand.generateNestjsCommandApplication(
      argumentsOrTree.tree,
      argumentsOrTree.options,
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
    return value;
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
      NestjsCommandApplicationCommand.normalizeCommandOptions(options);

    await runGeneratorCommandWithCallback({
      generate: async (argumentsOrTree) => this.generate(argumentsOrTree),
      logger: this.logger,
      options: parsedOptions,
      successMessage: this.successMessage,
    });
  }
}
