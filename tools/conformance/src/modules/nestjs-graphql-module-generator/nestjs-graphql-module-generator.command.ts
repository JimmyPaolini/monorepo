import { execSync } from "node:child_process";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import { getProjects, workspaceRoot } from "@nx/devkit";
import _ from "lodash";
import { Command, CommandRunner } from "nest-commander";

import { StringCase } from "../../types";
import { generateFiles, resolveName, resolveProject } from "../../utilities";
import { LoggerService } from "../logger/logger.service";

import {
  NESTJS_GRAPHQL_MODULE_NAME_PROMPT,
  NESTJS_GRAPHQL_MODULE_PROJECT_PROMPT,
  NESTJS_GRAPHQL_MODULE_PROJECT_TAG,
} from "./nestjs-graphql-module-generator.constants";

import type {
  NestjsGraphqlModuleGeneratorArguments,
  NestjsGraphqlModuleGeneratorOptions,
} from "./nestjs-graphql-module-generator.types";
import type { GeneratorCallback, Tree } from "@nx/devkit";

/**
 * TODO: Document the nestjsGraphqlModuleGenerator command.
 */
@Command({
  description: "Run the nestjs-graphql-module-generator command",
  name: "nestjs-graphql-module-generator",
})
@Injectable()
export class NestjsGraphqlModuleGeneratorCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(private readonly logger: LoggerService) {
    super();
    this.logger.setContext(NestjsGraphqlModuleGeneratorCommand.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

  /**
   * Auto-generated documentation placeholder.
   */
  async run(): Promise<void> {
    const generatorName = generateNestjsGraphqlModuleGenerator.name;
    this.logger.log(
      `Generator command module scaffolded and ready for wiring (${generatorName}).`,
    );
    await Promise.resolve();
  }
}

/**
 * Auto-generated documentation placeholder.
 */
export async function generateNestjsGraphqlModuleGenerator(
  args: NestjsGraphqlModuleGeneratorArguments,
): Promise<GeneratorCallback> {
  const { options, tree } = args;
  const directory = await resolveModuleDirectory(tree, options);
  const nameKebabCase = await resolveName({
    case: StringCase.KEBAB_CASE,
    message: NESTJS_GRAPHQL_MODULE_NAME_PROMPT,
    name: options.name,
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
      "tools/conformance/src/generators/nestjs-graphql-module/templates",
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
async function resolveModuleDirectory(
  tree: Tree,
  options: NestjsGraphqlModuleGeneratorOptions,
): Promise<string> {
  const projectName = await resolveProject({
    tag: NESTJS_GRAPHQL_MODULE_PROJECT_TAG,
    tree,
    ...(options.project !== undefined && { project: options.project }),
    message: NESTJS_GRAPHQL_MODULE_PROJECT_PROMPT,
  });

  const allProjects = getProjects(tree);
  const projectConfig = allProjects.get(projectName);
  const projectRoot = projectConfig?.root ?? projectConfig?.sourceRoot;

  if (!projectRoot) {
    throw new Error(
      `Project "${projectName}" has no root directory configured`,
    );
  }

  const directory = path.join(projectRoot, "src", "modules");

  if (!tree.exists(directory)) {
    throw new Error(
      `Directory "${directory}" does not exist in project "${projectName}"`,
    );
  }

  return directory;
}
