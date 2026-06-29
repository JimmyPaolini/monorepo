// 🏷️ Types

import type { Tree } from "@nx/devkit";

/**
 * Arguments for the migrated service file generator function.
 */
export interface NestjsServiceFileGeneratorArguments {
  options: NestjsServiceFileGeneratorOptions;
  tree: Tree;
}

/**
 * Options supported by the migrated service file generator.
 */
export interface NestjsServiceFileGeneratorOptions {
  module?: string;
  name: string;
  project?: string;
}
