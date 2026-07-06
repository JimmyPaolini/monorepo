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
  NESTJS_COMMAND_MODULE_NAME_PROMPT,
  NESTJS_COMMAND_MODULE_PROJECT_PROMPT,
  NESTJS_COMMAND_MODULE_PROJECT_TAG,
  NESTJS_COMMAND_MODULE_TEMPLATE_DIRECTORY_PATH,
} from "./nestjs-command-module.constants";

import type {
  NestjsCommandModuleArguments,
  NestjsCommandModuleOptions,
} from "./nestjs-command-module.types";
import type { GeneratorCallback, Tree } from "@nx/devkit";

/**
 * Generates a NestJS command module scaffold from templates.
 */
@Command({
  description: "Generate a NestJS command module scaffold",
  name: "nestjs-command-module",
})
@Injectable()
export class NestjsCommandModuleCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(private readonly logger: LoggerService) {
    super();
    (this.logger as LoggerService | undefined)?.setContext(
      NestjsCommandModuleCommand.name,
    );
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  /**
   * Migrated core generator logic for creating a NestJS command module.
   */
  static async generateNestjsCommandModule(
    argumentsOrTree: NestjsCommandModuleArguments,
  ): Promise<GeneratorCallback>;
  // 🌎 Public Methods
  /**
   * Overload signature for tree and options based invocation.
   */
  static async generateNestjsCommandModule(
    tree: Tree,
    options?: NestjsCommandModuleOptions,
  ): Promise<GeneratorCallback>;
  /**
   * Overload signature for tree and options based invocation.
   */
  static async generateNestjsCommandModule(
    argumentsOrTree: NestjsCommandModuleArguments | Tree,
    options?: NestjsCommandModuleOptions,
  ): Promise<GeneratorCallback> {
    const resolvedArguments =
      isGeneratorInvocationArguments<NestjsCommandModuleOptions>(
        argumentsOrTree,
      )
        ? normalizeGeneratorInvocationFromArguments<NestjsCommandModuleOptions>(
            argumentsOrTree,
          )
        : normalizeGeneratorInvocationFromTree<NestjsCommandModuleOptions>({
            ...(options !== undefined && { options }),
            tree: argumentsOrTree,
          });
    const { options: resolvedOptions, tree } = resolvedArguments;
    const { nameKebabCase, projectName } =
      await NestjsCommandModuleCommand.resolveProjectAndName(
        tree,
        resolvedOptions,
      );
    const modulesDirectory = resolveProjectModulesDirectoryPath({
      projectName,
      tree,
    });
    const targetPath = path.join(modulesDirectory, nameKebabCase);
    const substitutions = {
      nameCamelCase: _.camelCase(nameKebabCase),
      nameKebabCase,
      namePascalCase: _.upperFirst(_.camelCase(nameKebabCase)),
    };

    generateFiles({
      instanceDirectoryPath: targetPath,
      substitutions,
      templateDirectoryPath: path.join(
        process.cwd(),
        NESTJS_COMMAND_MODULE_TEMPLATE_DIRECTORY_PATH,
      ),
      tree,
    });

    const generatedFiles = tree
      .children(targetPath)
      .map((fileName: string) => path.join(targetPath, fileName));

    return () => {
      execSync(
        `pnpm exec nx format:write --files=${generatedFiles.join(",")}`,
        {
          cwd: workspaceRoot,
          stdio: "inherit",
        },
      );
    };
  }
  /**
   * Resolves project and module name for command module generation.
   */
  private static async resolveProjectAndName(
    tree: Tree,
    options: NestjsCommandModuleOptions,
  ): Promise<{ nameKebabCase: string; projectName: string }> {
    const projectName = await resolveProject({
      tag: NESTJS_COMMAND_MODULE_PROJECT_TAG,
      tree,
      ...(options.project !== undefined && { project: options.project }),
      message: NESTJS_COMMAND_MODULE_PROJECT_PROMPT,
    });

    const nameKebabCase = await resolveName({
      case: StringCase.KEBAB_CASE,
      message: NESTJS_COMMAND_MODULE_NAME_PROMPT,
      ...(options.name !== undefined && { name: options.name }),
      subject: "Module name",
    });

    return { nameKebabCase, projectName };
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
    options: NestjsCommandModuleOptions,
  ): Promise<void> {
    const tree = createWorkspaceTree();
    const callback =
      await NestjsCommandModuleCommand.generateNestjsCommandModule({
        options,
        tree,
      });
    await commitWorkspaceTree({ callback, tree });
    this.logger.log("Generated NestJS command module scaffold.");
  }
}
