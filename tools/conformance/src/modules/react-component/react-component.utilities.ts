import {
  isGeneratorInvocationArguments,
  normalizeGeneratorInvocationFromArguments,
  normalizeGeneratorInvocationFromTree,
} from "../../utilities";

import { ReactComponentCommand } from "./react-component.command";

import type {
  ReactComponentArguments,
  ReactComponentOptions,
} from "./react-component.types";
import type { Tree } from "@nx/devkit";

/**
 * Generates the React component scaffold.
 */
export async function generateReactComponent(
  argumentsOrTree: ReactComponentArguments | Tree,
  options?: ReactComponentOptions,
): Promise<void> {
  const { options: resolvedOptions, tree } = isGeneratorInvocationArguments(
    argumentsOrTree,
  )
    ? normalizeGeneratorInvocationFromArguments(argumentsOrTree)
    : normalizeGeneratorInvocationFromTree({
        options: options === undefined ? {} : options,
        tree: argumentsOrTree,
      });

  await ReactComponentCommand.generateReactComponent(tree, resolvedOptions);
}
