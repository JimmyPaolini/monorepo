import {
  isGeneratorInvocationArguments,
  normalizeGeneratorInvocationFromArguments,
  normalizeGeneratorInvocationFromTree,
} from "../../utilities";

import { JupyterNotebookApplicationCommand } from "./jupyter-notebook-application.command";

import type {
  JupyterNotebookApplicationArguments,
  JupyterNotebookApplicationOptions,
} from "./jupyter-notebook-application.types";
import type { Tree } from "@nx/devkit";

/**
 * Generates the Jupyter notebook application scaffold.
 */
export async function generateJupyterNotebookApplication(
  argumentsOrTree: JupyterNotebookApplicationArguments | Tree,
  options?: JupyterNotebookApplicationOptions,
): Promise<void> {
  const { options: resolvedOptions, tree } = isGeneratorInvocationArguments(
    argumentsOrTree,
  )
    ? normalizeGeneratorInvocationFromArguments(argumentsOrTree)
    : normalizeGeneratorInvocationFromTree({
        options: options === undefined ? {} : options,
        tree: argumentsOrTree,
      });

  await JupyterNotebookApplicationCommand.generateJupyterNotebookApplication(
    tree,
    resolvedOptions,
  );
}
