import path from "node:path";

import { Injectable } from "@nestjs/common";
import { Command, Option } from "nest-commander";

import {
  buildKebabCaseNameSubstitutions,
  generateTemplateScaffold,
  type GeneratorInvocationArguments,
  normalizeGeneratorInvocationFromTree,
  parseStringCommandOption,
  resolveOptionalKebabCaseName,
  resolveProject,
  resolveProjectComponentsDirectoryPath,
} from "../../utilities";
import { ModuleGeneratorCommandRunner } from "../generator/module-generator-command-runner.service";
import { LoggerService } from "../logger/logger.service";

import {
  REACT_COMPONENT_NAME_PROMPT,
  REACT_COMPONENT_PROJECT_PROMPT,
  REACT_COMPONENT_PROJECT_TAG,
} from "./react-component.constants";

import type {
  ReactComponentArguments,
  ReactComponentOptions,
} from "./react-component.types";
import type { Tree } from "@nx/devkit";

/**
 * Generates a React component scaffold from templates.
 */
@Command({
  description: "Generate a React component scaffold",
  name: "react-component",
})
@Injectable()
export class ReactComponentCommand extends ModuleGeneratorCommandRunner<ReactComponentOptions> {
  // 🏗 Dependency Injection

  constructor(logger: LoggerService) {
    super(logger);
    logger.setContext(ReactComponentCommand.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  protected readonly successMessage = "Generated React component scaffold.";

  // 🔏 Private Methods

  /**
   * Migrated core generator logic for creating a React component.
   */
  static async generateReactComponent(
    workspaceTree: Tree,
    generatorOptions: Partial<ReactComponentOptions> = {},
  ): Promise<void> {
    const resolvedArguments =
      normalizeGeneratorInvocationFromTree<ReactComponentOptions>({
        options: generatorOptions,
        tree: workspaceTree,
      });

    await generateTemplateScaffold<ReactComponentOptions>({
      argumentsOrTree: resolvedArguments,
      format: "tree",
      resolveGeneration: async ({ options: resolvedOptions, tree }) => {
        const projectName = await resolveProject({
          tag: REACT_COMPONENT_PROJECT_TAG,
          tree,
          ...(resolvedOptions.project !== undefined && {
            project: resolvedOptions.project,
          }),
          message: REACT_COMPONENT_PROJECT_PROMPT,
        });

        const name = await resolveOptionalKebabCaseName({
          message: REACT_COMPONENT_NAME_PROMPT,
          ...(resolvedOptions.name !== undefined && {
            name: resolvedOptions.name,
          }),
          subject: "Component name",
        });

        return {
          instanceDirectoryPath: resolveProjectComponentsDirectoryPath({
            projectName,
            tree,
          }),
          substitutions: buildKebabCaseNameSubstitutions(name),
          templateDirectoryPath: path.join(
            process.cwd(),
            "tools/conformance/src/modules/react-component/templates",
          ),
        };
      },
    });
  }

  // 🌎 Public Methods

  /**
   * Converts command-runner arguments to tree-first invocation.
   */
  static async generateReactComponentFromArguments(
    argumentsOrTree: ReactComponentArguments,
  ): Promise<void> {
    const workspaceTree = argumentsOrTree.tree;
    await ReactComponentCommand.generateReactComponent(
      workspaceTree,
      argumentsOrTree.options,
    );
  }

  /**
   * Delegates generation to the React component scaffold factory.
   */
  protected override async generate(
    argumentsOrTree: GeneratorInvocationArguments<ReactComponentOptions>,
  ): Promise<undefined> {
    await ReactComponentCommand.generateReactComponentFromArguments(
      argumentsOrTree,
    );
    return undefined;
  }

  /**
   * Parses the optional component name argument.
   */
  @Option({
    description: "Component name in kebab-case",
    flags: "-n, --name [name]",
  })
  override parseNameOption(value: string): string {
    return parseStringCommandOption(value);
  }

  /**
   * Parses the optional parent project argument.
   */
  @Option({
    description: "Parent project name in kebab-case",
    flags: "-p, --project [project]",
  })
  override parseProjectOption(value: string): string {
    return parseStringCommandOption(value);
  }
}
