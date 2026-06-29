import path from "node:path";

import { Injectable } from "@nestjs/common";
import { formatFiles } from "@nx/devkit";
import { Command, CommandRunner, Option } from "nest-commander";

import { APPLICATIONS_DIRECTORY } from "../../constants";
import { StringCase } from "../../types";
import {
  commitWorkspaceTree,
  createWorkspaceTree,
  generateFiles,
  resolveName,
} from "../../utilities";
import { LoggerService } from "../logger/logger.service";

import { JUPYTER_NOTEBOOK_APPLICATION_NAME_PROMPT } from "./jupyter-notebook-application.constants";

import type {
  JupyterNotebookApplicationArguments,
  JupyterNotebookApplicationOptions,
} from "./jupyter-notebook-application.types";

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
    (this.logger as LoggerService | undefined)?.setContext(
      JupyterNotebookApplicationCommand.name,
    );
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

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
    description: "Application name in kebab-case",
    flags: "-n, --name [name]",
  })
  parseNameOption(value: string): string {
    return value;
  }

  /**
   * Runs generator logic using CLI options and writes generated files to disk.
   */
  async run(
    _passedParameters: string[],
    options: JupyterNotebookApplicationOptions,
  ): Promise<void> {
    const tree = createWorkspaceTree();
    await generateJupyterNotebookApplication({
      options,
      tree,
    });
    await commitWorkspaceTree({ tree });
    this.logger.log("Generated Jupyter notebook application scaffold.");
  }
}

/**
 * Migrated core generator logic for creating a Jupyter notebook application.
 */
export async function generateJupyterNotebookApplication(
  args: JupyterNotebookApplicationArguments,
): Promise<void> {
  const { options, tree } = args;
  const applicationName = await resolveName({
    case: StringCase.KEBAB_CASE,
    message: JUPYTER_NOTEBOOK_APPLICATION_NAME_PROMPT,
    ...(options.name !== undefined && { name: options.name }),
    subject: "Application name",
  });
  const targetDirectory = path.join(APPLICATIONS_DIRECTORY, applicationName);

  if (tree.exists(targetDirectory)) {
    throw new Error(
      `Directory "${targetDirectory}" already exists. Choose a different application name.`,
    );
  }

  generateFiles({
    instanceDirectoryPath: targetDirectory,
    substitutions: {
      description:
        options.description ??
        `A Python + Jupyter notebook application scaffold for ${applicationName}`,
      name: applicationName,
    },
    templateDirectoryPath: path.join(
      process.cwd(),
      "tools/conformance/src/modules/jupyter-notebook-application/templates",
    ),
    tree,
  });

  await formatFiles(tree);
}
