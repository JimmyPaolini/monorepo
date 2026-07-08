import path from "node:path";

import { Injectable } from "@nestjs/common";
import { Command, CommandRunner, Option } from "nest-commander";

import { APPLICATIONS_DIRECTORY } from "../../constants";
import {
  buildKebabCaseNameSubstitutions,
  formatTemplateScaffoldTree,
  type GeneratorInvocationArguments,
  normalizeGeneratorInvocationFromTree,
  resolveOptionalKebabCaseName,
  runGeneratorCommandWithCallback,
} from "../../utilities";
import { LoggerService } from "../logger/logger.service";

import { JUPYTER_NOTEBOOK_APPLICATION_NAME_PROMPT } from "./jupyter-notebook-application.constants";

import type {
  JupyterNotebookApplicationArguments,
  JupyterNotebookApplicationOptions,
} from "./jupyter-notebook-application.types";
import type { Tree } from "@nx/devkit";

/**
 * Generates a Jupyter notebook application scaffold from templates.
 */
@Command({
  description: "Generate a Jupyter notebook application scaffold",
  name: "jupyter-notebook-application",
})
@Injectable()
export class JupyterNotebookApplicationCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(private readonly logger: LoggerService) {
    super();
    this.logger.setContext(JupyterNotebookApplicationCommand.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  protected readonly successMessage =
    "Generated Jupyter notebook application scaffold.";

  // 🔏 Private Methods

  /**
   * Migrated core generator logic for creating a Jupyter notebook application.
   */
  static async generateJupyterNotebookApplication(
    workspaceTree: Tree,
    generatorOptions: Partial<JupyterNotebookApplicationOptions> = {},
  ): Promise<void> {
    const { options: resolvedOptions, tree } =
      normalizeGeneratorInvocationFromTree<JupyterNotebookApplicationOptions>({
        options: generatorOptions,
        tree: workspaceTree,
      });
    const applicationName = await resolveOptionalKebabCaseName({
      message: JUPYTER_NOTEBOOK_APPLICATION_NAME_PROMPT,
      ...(resolvedOptions.name !== undefined && {
        name: resolvedOptions.name,
      }),
      subject: "Application name",
    });
    const targetDirectory = path.join(APPLICATIONS_DIRECTORY, applicationName);

    if (tree.exists(targetDirectory)) {
      throw new Error(
        `Directory "${targetDirectory}" already exists. Choose a different application name.`,
      );
    }

    await formatTemplateScaffoldTree({
      generation: {
        instanceDirectoryPath: targetDirectory,
        substitutions: {
          ...buildKebabCaseNameSubstitutions(applicationName),
          description:
            resolvedOptions.description ??
            `A Python + Jupyter notebook application scaffold for ${applicationName}`,
          name: applicationName,
        },
        templateDirectoryPath: path.join(
          process.cwd(),
          "tools/conformance/src/modules/jupyter-notebook-application/templates",
        ),
      },
      tree,
    });
  }

  // 🌎 Public Methods

  /**
   * Converts command-runner arguments to tree-first invocation.
   */
  static async generateJupyterNotebookApplicationFromArguments(
    argumentsOrTree: JupyterNotebookApplicationArguments,
  ): Promise<void> {
    const workspaceTree = argumentsOrTree.tree;
    await JupyterNotebookApplicationCommand.generateJupyterNotebookApplication(
      workspaceTree,
      argumentsOrTree.options,
    );
  }

  /**
   * Normalizes raw command options into the typed command option shape.
   */
  private static normalizeCommandOptions(
    options: Record<string, unknown> | undefined,
  ): JupyterNotebookApplicationOptions {
    const normalizedOptions: JupyterNotebookApplicationOptions = {};

    if (typeof options?.["description"] === "string") {
      normalizedOptions.description = options["description"];
    }

    if (typeof options?.["name"] === "string") {
      normalizedOptions.name = options["name"];
    }

    return normalizedOptions;
  }

  /**
   * Delegates generation to the Jupyter notebook application scaffold factory.
   */
  protected async generate(
    argumentsOrTree: GeneratorInvocationArguments<JupyterNotebookApplicationOptions>,
  ): Promise<undefined> {
    await JupyterNotebookApplicationCommand.generateJupyterNotebookApplication(
      argumentsOrTree.tree,
      argumentsOrTree.options,
    );
    return undefined;
  }

  /**
   * Parses the optional project description argument.
   */
  @Option({
    description: "Application description",
    flags: "-d, --description [description]",
  })
  parseDescriptionOption(value: string): string {
    return value;
  }

  /**
   * Parses the optional application name argument.
   */
  @Option({
    description: "Name in kebab-case",
    flags: "-n, --name [name]",
  })
  parseNameOption(value: string): string {
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
      JupyterNotebookApplicationCommand.normalizeCommandOptions(options);

    await runGeneratorCommandWithCallback({
      generate: async (argumentsOrTree) => this.generate(argumentsOrTree),
      logger: this.logger,
      options: parsedOptions,
      successMessage: this.successMessage,
    });
  }
}
