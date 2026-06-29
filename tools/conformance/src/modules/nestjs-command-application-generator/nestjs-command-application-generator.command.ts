import path from "node:path";

import { Injectable } from "@nestjs/common";
import { formatFiles } from "@nx/devkit";
import _ from "lodash";
import { Command, CommandRunner } from "nest-commander";
import prompts from "prompts";

import { APPLICATIONS_DIRECTORY, DESTINATION_ROOTS } from "../../constants";
import { StringCase } from "../../types";
import { generateFiles, resolveName } from "../../utilities";
import { LoggerService } from "../logger/logger.service";

import {
  NESTJS_COMMAND_APPLICATION_DESTINATION_ROOT_PROMPT,
  NESTJS_COMMAND_APPLICATION_NAME_PROMPT,
} from "./nestjs-command-application-generator.constants";

import type { NestjsCommandApplicationGeneratorArguments } from "./nestjs-command-application-generator.types";
import type { Choice, PromptObject } from "prompts";

/** Valid destination roots for generated command applications. */
type DestinationRoot = (typeof DESTINATION_ROOTS)[number];

/**
 * Migrated core generator logic for creating a NestJS command application.
 */
export async function generateNestjsCommandApplicationGenerator(
  args: NestjsCommandApplicationGeneratorArguments,
): Promise<void> {
  const { options, tree } = args;
  const nameKebabCase = await resolveName({
    case: StringCase.KEBAB_CASE,
    message: NESTJS_COMMAND_APPLICATION_NAME_PROMPT,
    ...(options.name !== undefined && { name: options.name }),
    subject: "Application name",
  });

  const destinationRoot = await resolveDestinationRoot({
    message: NESTJS_COMMAND_APPLICATION_DESTINATION_ROOT_PROMPT,
    ...(options.destinationRoot !== undefined && {
      destinationRoot: options.destinationRoot,
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
      "tools/conformance/src/generators/nestjs-command-application/templates",
    ),
    tree,
  });

  await formatFiles(tree);
}

/**
 * Returns whether the value is a valid destination root.
 */
function isDestinationRoot(value: string): value is DestinationRoot {
  const destinationRoots: readonly string[] = DESTINATION_ROOTS;
  return destinationRoots.includes(value);
}

/**
 * Prompts for destination root selection.
 */
async function promptDestinationRoot(): Promise<DestinationRoot> {
  const request: PromptObject<"destinationRoot"> = {
    choices: DESTINATION_ROOTS.map(
      (value): Choice => ({ title: value, value }),
    ),
    initial: DESTINATION_ROOTS.indexOf(APPLICATIONS_DIRECTORY),
    message: NESTJS_COMMAND_APPLICATION_DESTINATION_ROOT_PROMPT,
    name: "destinationRoot",
    type: "select",
  };
  const response: { destinationRoot: DestinationRoot | undefined } =
    await prompts(request);

  if (!response.destinationRoot) {
    throw new Error("No destination root selected");
  }

  return response.destinationRoot;
}

/**
 * TODO: Document the nestjsCommandApplicationGenerator command.
 */
@Command({
  description: "Run the nestjs-command-application-generator command",
  name: "nestjs-command-application-generator",
})
@Injectable()
export class NestjsCommandApplicationGeneratorCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(private readonly logger: LoggerService) {
    super();
    this.logger.setContext(NestjsCommandApplicationGeneratorCommand.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

  /**
   * Auto-generated documentation placeholder.
   */
  async run(): Promise<void> {
    this.logger.debug(generateNestjsCommandApplicationGenerator.name);
    this.logger.log(
      "Generator command module scaffolded and ready for wiring.",
    );
    await Promise.resolve();
  }
}

/**
 * Resolves the destination root for generated command applications.
 */
async function resolveDestinationRoot(args: {
  destinationRoot?: string;
  message: string;
}): Promise<DestinationRoot> {
  const destinationRoot =
    args.destinationRoot ?? (await promptDestinationRoot());

  if (!isDestinationRoot(destinationRoot)) {
    throw new Error(
      `Destination root "${destinationRoot}" is not valid. Allowed values: ${DESTINATION_ROOTS.join(", ")}`,
    );
  }

  return destinationRoot;
}
