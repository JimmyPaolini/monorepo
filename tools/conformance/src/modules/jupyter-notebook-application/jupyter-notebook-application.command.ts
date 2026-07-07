import path from "node:path";

import { Injectable } from "@nestjs/common";
import { Command, Option } from "nest-commander";

import { APPLICATIONS_DIRECTORY } from "../../constants";
import {
  buildKebabCaseNameSubstitutions,
  type GeneratorInvocationArguments,
  isGeneratorInvocationArguments,
  normalizeGeneratorInvocationFromArguments,
  normalizeGeneratorInvocationFromTree,
  parseStringCommandOption,
} from "../../utilities";
import { GeneratorTemplateService } from "../generator/generator-template.service";
import { NameGeneratorCommandRunner } from "../generator/name-generator-command-runner.service";
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
export class JupyterNotebookApplicationCommand extends NameGeneratorCommandRunner<JupyterNotebookApplicationOptions> {
  // 🏗 Dependency Injection

  constructor(logger: LoggerService) {
    super(logger);
    logger.setContext(JupyterNotebookApplicationCommand.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  protected readonly successMessage =
    "Generated Jupyter notebook application scaffold.";

  // 🔏 Private Methods

  // 🌎 Public Methods

  /**
   * Migrated core generator logic for creating a Jupyter notebook application.
   */
  static async generateJupyterNotebookApplication(
    argumentsOrTree: JupyterNotebookApplicationArguments,
  ): Promise<void>;
  /**
   * Overload signature for tree and options based invocation.
   */
  static async generateJupyterNotebookApplication(
    tree: Tree,
    options?: JupyterNotebookApplicationOptions,
  ): Promise<void>;
  /**
   * Overload signature for tree and options based invocation.
   */
  static async generateJupyterNotebookApplication(
    argumentsOrTree: JupyterNotebookApplicationArguments | Tree,
    options?: JupyterNotebookApplicationOptions,
  ): Promise<void> {
    const resolvedArguments =
      isGeneratorInvocationArguments<JupyterNotebookApplicationOptions>(
        argumentsOrTree,
      )
        ? normalizeGeneratorInvocationFromArguments<JupyterNotebookApplicationOptions>(
            argumentsOrTree,
          )
        : normalizeGeneratorInvocationFromTree<JupyterNotebookApplicationOptions>(
            {
              ...(options !== undefined && { options }),
              tree: argumentsOrTree,
            },
          );

    await GeneratorTemplateService.generateTreeTemplateScaffoldWithOptionalName<JupyterNotebookApplicationOptions>(
      {
        argumentsOrTree: resolvedArguments,
        nameMessage: JUPYTER_NOTEBOOK_APPLICATION_NAME_PROMPT,
        nameSubject: "Application name",
        resolveGenerationWithName: ({
          nameKebabCase: applicationName,
          options: resolvedOptions,
          tree,
        }) => {
          const targetDirectory = path.join(
            APPLICATIONS_DIRECTORY,
            applicationName,
          );

          if (tree.exists(targetDirectory)) {
            throw new Error(
              `Directory "${targetDirectory}" already exists. Choose a different application name.`,
            );
          }

          return {
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
          };
        },
      },
    );
  }

  /**
   * Delegates generation to the Jupyter notebook application scaffold factory.
   */
  protected override async generate(
    argumentsOrTree: GeneratorInvocationArguments<JupyterNotebookApplicationOptions>,
  ): Promise<undefined> {
    await JupyterNotebookApplicationCommand.generateJupyterNotebookApplication(
      argumentsOrTree,
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
    return parseStringCommandOption(value);
  }
}
