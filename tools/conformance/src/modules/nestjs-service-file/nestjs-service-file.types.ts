// 🏷️ Types

import type { Tree } from "@nx/devkit";

/**
 * Arguments for the migrated service file generator function.
 */
export interface NestjsServiceFileArguments {
  options: NestjsServiceFileOptions;
  tree: Tree;
}

/**
 * Options supported by the migrated service file generator.
 */
export interface NestjsServiceFileOptions {
  module?: string;
  name?: string;
  project?: string;
}
