import path from "node:path";

import { Injectable } from "@nestjs/common";
import { formatFiles } from "@nx/devkit";
import _ from "lodash";
import { Command, CommandRunner } from "nest-commander";

import { APPLICATIONS_DIRECTORY } from "../../constants";
import { StringCase } from "../../types";
import { generateFiles, resolveName } from "../../utilities";
import { LoggerService } from "../logger/logger.service";

import { NESTJS_GRAPHQL_APPLICATION_NAME_PROMPT } from "./nestjs-graphql-application-generator.constants";

import type { NestjsGraphqlApplicationGeneratorArguments } from "./nestjs-graphql-application-generator.types";

/**
 * TODO: Document the nestjsGraphqlApplicationGenerator command.
 */
@Command({
  description: "Run the nestjs-graphql-application-generator command",
  name: "nestjs-graphql-application-generator",
})
@Injectable()
export class NestjsGraphqlApplicationGeneratorCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(private readonly logger: LoggerService) {
    super();
    this.logger.setContext(NestjsGraphqlApplicationGeneratorCommand.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

  /**
   * Auto-generated documentation placeholder.
   */
  async run(): Promise<void> {
    this.logger.debug(generateNestjsGraphqlApplicationGenerator.name);
    this.logger.log(
      "Generator command module scaffolded and ready for wiring.",
    );
    await Promise.resolve();
  }
}

/**
 * Migrated core generator logic for creating a NestJS GraphQL application.
 */
export async function generateNestjsGraphqlApplicationGenerator(
  args: NestjsGraphqlApplicationGeneratorArguments,
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
      "tools/conformance/src/generators/nestjs-graphql-application/templates",
    ),
    tree,
  });

  await formatFiles(tree);
}
