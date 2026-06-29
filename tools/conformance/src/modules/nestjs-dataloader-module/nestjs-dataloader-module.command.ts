import { execSync } from "node:child_process";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import { getProjects, workspaceRoot } from "@nx/devkit";
import _ from "lodash";
import { Command, CommandRunner, Option } from "nest-commander";

import { MODULES_DIRECTORY } from "../../constants";
import { StringCase } from "../../types";
import {
  commitWorkspaceTree,
  createWorkspaceTree,
  generateFiles,
  resolveName,
  resolveProject,
} from "../../utilities";
import { LoggerService } from "../logger/logger.service";

import {
  NESTJS_DATALOADER_MODULE_NAME_PROMPT,
  NESTJS_DATALOADER_MODULE_PROJECT_PROMPT,
  NESTJS_DATALOADER_MODULE_PROJECT_TAG,
  NESTJS_DATALOADER_MODULE_TEMPLATE_DIRECTORY_PATH,
} from "./nestjs-dataloader-module.constants";

import type {
  NestjsDataloaderModuleArguments,
  NestjsDataloaderModuleOptions,
} from "./nestjs-dataloader-module.types";
import type { GeneratorCallback, Tree } from "@nx/devkit";

/**
 * Generates NestJS DataLoader modules from the existing conformance templates.
 */
@Command({
  description: "Generate a NestJS DataLoader module scaffold",
  name: "nestjs-dataloader-module",
})
@Injectable()
export class NestjsDataloaderModuleCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(private readonly logger: LoggerService) {
    super();
    (this.logger as LoggerService | undefined)?.setContext(
      NestjsDataloaderModuleCommand.name,
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
    options: NestjsDataloaderModuleOptions,
  ): Promise<void> {
    const tree = createWorkspaceTree();
    const callback = await generateNestjsDataloaderModule({
      options,
      tree,
    });
    await commitWorkspaceTree({ callback, tree });
    this.logger.log("Generated NestJS DataLoader module scaffold.");
  }
}

/**
 * Migrated core generator logic for creating a NestJS DataLoader module.
 */
export async function generateNestjsDataloaderModule(
  args: NestjsDataloaderModuleArguments,
): Promise<GeneratorCallback> {
  const { options, tree } = args;
  const { nameKebabCase, projectName } = await resolveProjectAndName(
    tree,
    options,
  );
  const modulesDirectory = resolveValidatedModulesDirectory(tree, projectName);
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
      workspaceRoot,
      NESTJS_DATALOADER_MODULE_TEMPLATE_DIRECTORY_PATH,
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
  options: NestjsDataloaderModuleOptions,
): Promise<{ nameKebabCase: string; projectName: string }> {
  const projectName = await resolveProject({
    tag: NESTJS_DATALOADER_MODULE_PROJECT_TAG,
    tree,
    ...(options.project !== undefined && { project: options.project }),
    message: NESTJS_DATALOADER_MODULE_PROJECT_PROMPT,
  });

  const nameKebabCase = await resolveName({
    case: StringCase.KEBAB_CASE,
    message: NESTJS_DATALOADER_MODULE_NAME_PROMPT,
    name: options.name,
    subject: "Module name",
  });

  return { nameKebabCase, projectName };
}

/**
 * Auto-generated documentation placeholder.
 */
function resolveValidatedModulesDirectory(
  tree: Tree,
  projectName: string,
): string {
  const allProjects = getProjects(tree);
  const projectConfig = allProjects.get(projectName);
  const projectRoot = projectConfig?.root ?? projectConfig?.sourceRoot;

  if (!projectRoot) {
    throw new Error(
      `Project "${projectName}" has no root directory configured`,
    );
  }

  const modulesDirectory = path.join(projectRoot, MODULES_DIRECTORY);

  if (!tree.exists(modulesDirectory)) {
    throw new Error(
      `Directory "${modulesDirectory}" does not exist in project "${projectName}"`,
    );
  }

  return modulesDirectory;
}
