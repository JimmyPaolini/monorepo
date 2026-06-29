import path from "node:path";

import { Injectable } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";

import { APPLICATIONS_DIRECTORY } from "../../constants";
import { StringCase } from "../../types";
import { generateFiles, resolveName } from "../../utilities";
import { LoggerService } from "../logger/logger.service";

import { JUPYTER_NOTEBOOK_APPLICATION_NAME_PROMPT } from "./jupyter-notebook-application-generator.constants";

import type { JupyterNotebookApplicationGeneratorArguments } from "./jupyter-notebook-application-generator.types";

/**
 * TODO: Document the jupyterNotebookApplicationGenerator command.
 */
@Command({
  description: "Run the jupyter-notebook-application-generator command",
  name: "jupyter-notebook-application-generator",
})
@Injectable()
export class JupyterNotebookApplicationGeneratorCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(private readonly logger: LoggerService) {
    super();
    this.logger.setContext(JupyterNotebookApplicationGeneratorCommand.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

  /**
   * Auto-generated documentation placeholder.
   */
  async run(): Promise<void> {
    this.logger.debug(generateJupyterNotebookApplicationGenerator.name);
    this.logger.log(
      "Generator command module scaffolded and ready for wiring.",
    );
    await Promise.resolve();
  }
}

/**
 * Migrated core generator logic for creating a Jupyter notebook application.
 */
export async function generateJupyterNotebookApplicationGenerator(
  args: JupyterNotebookApplicationGeneratorArguments,
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
      "tools/conformance/src/generators/jupyter-notebook-application/templates",
    ),
    tree,
  });

  const { formatFiles } = await import("@nx/devkit");
  await formatFiles(tree);
}
