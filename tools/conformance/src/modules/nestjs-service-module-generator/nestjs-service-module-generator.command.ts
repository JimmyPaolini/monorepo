import { execSync } from "node:child_process";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import { getProjects, workspaceRoot } from "@nx/devkit";
import _ from "lodash";
import { Command, CommandRunner } from "nest-commander";

import { MODULES_DIRECTORY } from "../../constants";
import { StringCase } from "../../types";
import { generateFiles, resolveName, resolveProject } from "../../utilities";
import { LoggerService } from "../logger/logger.service";

import {
  NESTJS_SERVICE_MODULE_NAME_PROMPT,
  NESTJS_SERVICE_MODULE_PROJECT_PROMPT,
  NESTJS_SERVICE_MODULE_PROJECT_TAG,
} from "./nestjs-service-module-generator.constants";

import type {
  NestjsServiceModuleGeneratorArguments,
  NestjsServiceModuleGeneratorOptions,
} from "./nestjs-service-module-generator.types";
import type { GeneratorCallback, Tree } from "@nx/devkit";

/**
 * TODO: Document the nestjsServiceModuleGenerator command.
 */
@Command({
  description: "Run the nestjs-service-module-generator command",
  name: "nestjs-service-module-generator",
})
@Injectable()
export class NestjsServiceModuleGeneratorCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(private readonly logger: LoggerService) {
    super();
    this.logger.setContext(NestjsServiceModuleGeneratorCommand.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

  /**
   * Auto-generated documentation placeholder.
   */
  async run(): Promise<void> {
    const generatorName = generateNestjsServiceModuleGenerator.name;
    this.logger.log(
      `Generator command module scaffolded and ready for wiring (${generatorName}).`,
    );
    await Promise.resolve();
  }
}

/**
 * Auto-generated documentation placeholder.
 */
export async function generateNestjsServiceModuleGenerator(
  args: NestjsServiceModuleGeneratorArguments,
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
      process.cwd(),
      "tools/conformance/src/generators/nestjs-service-module/templates",
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
  options: NestjsServiceModuleGeneratorOptions,
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
