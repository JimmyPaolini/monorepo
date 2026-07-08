import path from "node:path";

import { Injectable } from "@nestjs/common";
import { Command, CommandRunner, Option } from "nest-commander";

import {
  buildKebabCaseNameSubstitutions,
  formatTemplateScaffoldTree,
  type GeneratorInvocationArguments,
  normalizeGeneratorInvocationFromTree,
  resolveOptionalKebabCaseName,
  resolveProject,
  resolveProjectComponentsDirectoryPath,
  runGeneratorCommandWithCallback,
} from "../../utilities";
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
export class ReactComponentCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(private readonly logger: LoggerService) {
    super();
    this.logger.setContext(ReactComponentCommand.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  protected readonly successMessage = "Generated React component scaffold.";

  /**
   * Migrated core generator logic for creating a React component.
   */
  static async generateReactComponent(
    workspaceTree: Tree,
    generatorOptions: Partial<ReactComponentOptions> = {},
  ): Promise<void> {
    const { options: resolvedOptions, tree } =
      normalizeGeneratorInvocationFromTree<ReactComponentOptions>({
        options: generatorOptions,
        tree: workspaceTree,
      });
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

    await formatTemplateScaffoldTree({
      generation: {
        instanceDirectoryPath: resolveProjectComponentsDirectoryPath({
          projectName,
          tree,
        }),
        substitutions: buildKebabCaseNameSubstitutions(name),
        templateDirectoryPath: path.join(
          process.cwd(),
          "tools/conformance/src/modules/react-component/templates",
        ),
      },
      tree,
    });
  }

  // 🔏 Private Methods

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

  // 🌎 Public Methods

  /**
   * Normalizes raw command options into the typed command option shape.
   */
  private static normalizeCommandOptions(
    options: Record<string, unknown> | undefined,
  ): ReactComponentOptions {
    const normalizedOptions: ReactComponentOptions = {};

    if (typeof options?.["name"] === "string") {
      normalizedOptions.name = options["name"];
    }

    if (typeof options?.["project"] === "string") {
      normalizedOptions.project = options["project"];
    }

    return normalizedOptions;
  }

  /**
   * Delegates generation to the React component scaffold factory.
   */
  protected async generate(
    argumentsOrTree: GeneratorInvocationArguments<ReactComponentOptions>,
  ): Promise<undefined> {
    await ReactComponentCommand.generateReactComponent(
      argumentsOrTree.tree,
      argumentsOrTree.options,
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
  parseNameOption(value: string): string {
    return value;
  }

  /**
   * Parses the optional parent project argument.
   */
  @Option({
    description: "Parent project name in kebab-case",
    flags: "-p, --project [project]",
  })
  parseProjectOption(value: string): string {
    return value;
  }

  /**
   * Runs generator command orchestration and logs success output.
   */
  async run(
    _passedParameters: string[],
    options?: Record<string, unknown>,
  ): Promise<void> {
    const parsedOptions =
      ReactComponentCommand.normalizeCommandOptions(options);

    await runGeneratorCommandWithCallback({
      generate: async (argumentsOrTree) => this.generate(argumentsOrTree),
      logger: this.logger,
      options: parsedOptions,
      successMessage: this.successMessage,
    });
  }
}
