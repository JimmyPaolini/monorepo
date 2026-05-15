import type { Node, SourceFile } from "typescript";

// abstract-syntax-tree.ts types

/** Arguments for the `validateComments` function. */
export interface ValidateCommentsArgs {
  templateNode: Node;
  instanceNode: Node;
  side: "pos" | "end";
  errors: string[];
}

/** Arguments for the `hasMatchingKeyPath` function. */
export interface HasMatchingKeyPathArgs {
  templateNode: Node;
  instanceNode: Node;
}

/** Arguments for the `validateDepthFirstSearch` function. */
export interface ValidateDepthFirstSearchArgs {
  /** The current node in the rendered template AST. */
  templateNode: Node;
  /** The current node in the generated file AST. */
  instanceNode: Node;
  /** Mutable array to which validation error messages are appended. */
  errors: string[];
  /** The instance `SourceFile`, used for line/character positions in errors. */
  instanceFile: SourceFile;
}

/** Arguments for the `findCorrespondingNode` function. */
export interface FindCorrespondingNodeArgs {
  /** The AST node from the rendered template. */
  templateNode: Node;
  /** Candidate nodes from the generated file at the same depth. */
  instanceNodes: Node[];
  /** The instance `SourceFile`, forwarded to structural subtree checks. */
  instanceFile: SourceFile;
}

/** Arguments for the `buildMissingNodeError` function. */
export interface BuildMissingNodeErrorArgs {
  templateChild: Node;
  instanceNode: Node;
  instanceFile: SourceFile;
}

// validator.ts types

/** Arguments for the `validateConformance` function. */
export interface ValidateConformanceArgs {
  /** The variable substitutions to render the template with. */
  data: Record<string, unknown>;
  /** File name with `.ts` or `.tsx` extension for script-kind inference. */
  filename: string;
  /** The current content of the generated file. */
  instance: string;
  /** The EJS template source used to generate the file. */
  template: string;
}

/** Arguments for the `validateInstanceFile` function. */
export interface ValidateInstanceFileArgs {
  /** Absolute path to the generated instance file. */
  instanceFilePath: string;
  /** Absolute path to the EJS template. */
  templateFilePath: string;
  /** The variable substitutions to render the template with. */
  data: Record<string, unknown>;
}

/** Arguments for the `validateInstanceDirectory` function. */
export interface ValidateInstanceDirectoryArgs {
  /** Path to the single generated instance directory (e.g. `src/modules/user-auth`). */
  instanceDirectoryPath: string;
  /** Path to the directory containing EJS template files. */
  templateDirectoryPath: string;
}

/** Arguments for the `validateInstancesDirectory` function. */
export interface ValidateInstancesDirectoryArgs {
  /** Path to the directory containing generated instance subdirectories. */
  instancesDirectoryPath: string;
  /** Path to the directory containing EJS template files. */
  templateDirectoryPath: string;
}

/** The validation result for a single generated file. */
export interface InstanceFileValidationResult {
  filename: string;
  errors: string[];
}

/** The validation result for a generated instance directory, grouping per-file results under the directory name. */
export interface InstanceDirectoryValidationResult {
  directoryName: string;
  results: InstanceFileValidationResult[];
}
