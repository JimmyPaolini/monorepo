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
  NESTJS_SERVICE_MODULE_NAME_PROMPT,
  NESTJS_SERVICE_MODULE_PROJECT_PROMPT,
  NESTJS_SERVICE_MODULE_PROJECT_TAG,
} from "./nestjs-service-module.constants";

import type {
  NestjsServiceModuleArguments,
  NestjsServiceModuleOptions,
} from "./nestjs-service-module.types";
import type { GeneratorCallback, Tree } from "@nx/devkit";

/**
 * Generates a NestJS service module scaffold from templates.
 */
@Command({
  description: "Generate a NestJS service module scaffold",
  name: "nestjs-service-module",
})
@Injectable()
export class NestjsServiceModuleCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(private readonly logger: LoggerService) {
    super();
    (this.logger as LoggerService | undefined)?.setContext(
      NestjsServiceModuleCommand.name,
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
    options: NestjsServiceModuleOptions,
  ): Promise<void> {
    const tree = createWorkspaceTree();
    const callback = await generateNestjsServiceModule({
      options,
      tree,
    });
    await commitWorkspaceTree({ callback, tree });
    this.logger.log("Generated NestJS service module scaffold.");
  }
}

/**
 * Auto-generated documentation placeholder.
 */
export async function generateNestjsServiceModule(
  argumentsOrTree: NestjsServiceModuleArguments,
): Promise<GeneratorCallback>;
export async function generateNestjsServiceModule(
  argumentsOrTree: NestjsServiceModuleArguments | Tree,
  options?: NestjsServiceModuleOptions,
): Promise<GeneratorCallback> {
  const resolvedArguments =
    isGeneratorInvocationArguments<NestjsServiceModuleOptions>(argumentsOrTree)
      ? normalizeGeneratorInvocationFromArguments<NestjsServiceModuleOptions>(
          argumentsOrTree,
        )
      : normalizeGeneratorInvocationFromTree<NestjsServiceModuleOptions>({
          ...(options !== undefined && { options }),
          tree: argumentsOrTree,
        });
  const { options: resolvedOptions, tree } = resolvedArguments;
  const { nameKebabCase, projectName } = await resolveProjectAndName(
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
      "tools/conformance/src/modules/nestjs-service-module/templates",
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

/**
 * Auto-generated documentation placeholder.
 */
async function resolveProjectAndName(
  tree: Tree,
  options: NestjsServiceModuleOptions,
): Promise<{ nameKebabCase: string; projectName: string }> {
  const projectName = await resolveProject({
    tag: NESTJS_SERVICE_MODULE_PROJECT_TAG,
    tree,
    ...(options.project !== undefined && { project: options.project }),
    message: NESTJS_SERVICE_MODULE_PROJECT_PROMPT,
  });

  const nameKebabCase = await resolveName({
    case: StringCase.KEBAB_CASE,
    message: NESTJS_SERVICE_MODULE_NAME_PROMPT,
    ...(options.name !== undefined && { name: options.name }),
    subject: "Module name",
  });

  return { nameKebabCase, projectName };
}
