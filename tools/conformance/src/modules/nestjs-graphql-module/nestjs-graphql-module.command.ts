import { execSync } from "node:child_process";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import { workspaceRoot } from "@nx/devkit";
import _ from "lodash";
import { Command, CommandRunner, Option } from "nest-commander";

import { StringCase } from "../../types";
import {
  commitWorkspaceTree,
  createWorkspaceTree,
  generateFiles,
  isGeneratorInvocationArguments,
  normalizeGeneratorInvocationFromArguments,
  normalizeGeneratorInvocationFromTree,
  resolveName,
  resolveProject,
  resolveProjectModulesDirectoryPath,
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
    (this.logger as LoggerService | undefined)?.setContext(
      NestjsGraphqlModuleCommand.name,
    );
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

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
   * Parses the optional project name argument.
   */
  @Option({
    description: "Parent project name in kebab-case",
    flags: "-p, --project [project]",
  })
  parseProjectOption(value: string): string {
    return value;
  }

  /**
   * Runs generator logic using CLI options and writes generated files to disk.
   */
  async run(
    _passedParameters: string[],
    options: NestjsGraphqlModuleOptions,
  ): Promise<void> {
    const tree = createWorkspaceTree();
    const callback = await generateNestjsGraphqlModule({
      options,
      tree,
    });
    await commitWorkspaceTree({ callback, tree });
    this.logger.log("Generated NestJS GraphQL module scaffold.");
  }
}

/**
 * Auto-generated documentation placeholder.
 */
export async function generateNestjsGraphqlModule(
  argumentsOrTree: NestjsGraphqlModuleArguments,
): Promise<GeneratorCallback>;
export async function generateNestjsGraphqlModule(
  argumentsOrTree: NestjsGraphqlModuleArguments | Tree,
  options?: NestjsGraphqlModuleOptions,
): Promise<GeneratorCallback> {
  const resolvedArguments =
    isGeneratorInvocationArguments<NestjsGraphqlModuleOptions>(argumentsOrTree)
      ? normalizeGeneratorInvocationFromArguments<NestjsGraphqlModuleOptions>(
          argumentsOrTree,
        )
      : normalizeGeneratorInvocationFromTree<NestjsGraphqlModuleOptions>({
          ...(options !== undefined && { options }),
          tree: argumentsOrTree,
        });
  const { options: resolvedOptions, tree } = resolvedArguments;
  const projectName = await resolveProject({
    tag: NESTJS_GRAPHQL_MODULE_PROJECT_TAG,
    tree,
    ...(resolvedOptions.project !== undefined && {
      project: resolvedOptions.project,
    }),
    message: NESTJS_GRAPHQL_MODULE_PROJECT_PROMPT,
  });
  const directory = resolveProjectModulesDirectoryPath({ projectName, tree });
  const nameKebabCase = await resolveName({
    case: StringCase.KEBAB_CASE,
    message: NESTJS_GRAPHQL_MODULE_NAME_PROMPT,
    ...(resolvedOptions.name !== undefined && { name: resolvedOptions.name }),
    subject: "Module name",
  });
  const targetPath = path.join(directory, nameKebabCase);

  generateFiles({
    instanceDirectoryPath: targetPath,
    substitutions: {
      nameCamelCase: _.camelCase(nameKebabCase),
      nameKebabCase,
      namePascalCase: _.upperFirst(_.camelCase(nameKebabCase)),
    },
    templateDirectoryPath: path.join(
      process.cwd(),
      "tools/conformance/src/modules/nestjs-graphql-module/templates",
    ),
    tree,
  });

  const generatedFiles = tree
    .children(targetPath)
    .map((fileName: string) => path.join(targetPath, fileName));

  return () => {
    execSync(`pnpm exec nx format:write --files=${generatedFiles.join(",")}`, {
      cwd: workspaceRoot,
      stdio: "inherit",
    });
  };
}
