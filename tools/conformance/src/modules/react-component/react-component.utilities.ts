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
  const { options: resolvedOptions, tree } =
    "options" in argumentsOrTree && "tree" in argumentsOrTree
      ? argumentsOrTree
      : {
          options: options ?? {},
          tree: argumentsOrTree,
        };

  await ReactComponentCommand.generateReactComponent(tree, resolvedOptions);
}
