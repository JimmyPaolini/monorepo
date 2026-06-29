import path from "node:path";

import { Injectable } from "@nestjs/common";
import { formatFiles } from "@nx/devkit";
import _ from "lodash";
import { Command, CommandRunner, Option } from "nest-commander";

import { APPLICATIONS_DIRECTORY } from "../../constants";
import { StringCase } from "../../types";
import {
  commitWorkspaceTree,
  createWorkspaceTree,
  generateFiles,
  resolveName,
} from "../../utilities";
import { LoggerService } from "../logger/logger.service";

import { NESTJS_GRAPHQL_APPLICATION_NAME_PROMPT } from "./nestjs-graphql-application.constants";

import type {
  NestjsGraphqlApplicationArguments,
  NestjsGraphqlApplicationOptions,
} from "./nestjs-graphql-application.types";

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
    (this.logger as LoggerService | undefined)?.setContext(
      NestjsGraphqlApplicationCommand.name,
    );
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

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
    options: NestjsGraphqlApplicationOptions,
  ): Promise<void> {
    const tree = createWorkspaceTree();
    await generateNestjsGraphqlApplication({
      options,
      tree,
    });
    await commitWorkspaceTree({ tree });
    this.logger.log("Generated NestJS GraphQL application scaffold.");
  }
}

/**
 * Migrated core generator logic for creating a NestJS GraphQL application.
 */
export async function generateNestjsGraphqlApplication(
  args: NestjsGraphqlApplicationArguments,
): Promise<void> {
  const { options, tree } = args;
  const nameKebabCase = await resolveName({
    case: StringCase.KEBAB_CASE,
    message: NESTJS_GRAPHQL_APPLICATION_NAME_PROMPT,
    ...(options.name !== undefined && { name: options.name }),
    subject: "Application name",
  });
  const projectRoot = path.join(APPLICATIONS_DIRECTORY, nameKebabCase);

  if (tree.exists(projectRoot)) {
    throw new Error(
      `Directory "${projectRoot}" already exists. Choose a different application name.`,
    );
  }

  const substitutions = {
    nameCamelCase: _.camelCase(nameKebabCase),
    nameKebabCase,
    namePascalCase: _.upperFirst(_.camelCase(nameKebabCase)),
  };

  generateFiles({
    instanceDirectoryPath: projectRoot,
    substitutions,
    templateDirectoryPath: path.join(
      process.cwd(),
      "tools/conformance/src/modules/nestjs-graphql-application/templates",
    ),
    tree,
  });

  await formatFiles(tree);
}
