/** Category of the missing element that caused the conformance failure. */
export type ConformanceErrorType = "comment" | "directory" | "file" | "code";

/**
 * The language / file format processed by the validator that produced the
 * error. Absent for `'file'` and `'directory'` errors.
 */
export type ConformanceErrorLanguage =
  | "javascript"
  | "json"
  | "markdown"
  | "text"
  | "typescript";

/**
 * A structured conformance error produced by any validator.
 *
 * Two discriminating fields identify the error category:
 * - `errorType` — what kind of element is missing
 * - `language` — which validator / file format produced the error
 *
 * All errors represent a *missing* element; there is no separate action field.
 */
export interface ConformanceError {
  /** Category of missing element. */
  readonly errorType: ConformanceErrorType;
  /**
   * File format of the validator that produced this error.
   * Absent for `'file'` and `'directory'` errors.
   */
  readonly language?: ConformanceErrorLanguage;
  /** Short human-readable description of what is missing. */
  readonly message: string;
  /** 1-based line number in the instance file where the error was detected. */
  readonly instanceLine?: number;
  /** 1-based column number in the instance file where the error was detected. */
  readonly instanceColumn?: number;
  /**
   * JSON dot-notation path in the instance document where the error was
   * detected, e.g. `"scripts.build[0]"`.
   */
  readonly instancePath?: string;
  /**
   * 1-based line number in the (rendered) template file that defines the
   * requirement.
   */
  readonly templateLine?: number;
  /**
   * 1-based column number in the (rendered) template file that defines the
   * requirement.
   */
  readonly templateColumn?: number;
  /** JSON dot-notation path in the template document. */
  readonly templatePath?: string;
  /** Snippet of the template content that should be present in the instance. */
  readonly expected?: string;
  /** Actual value found in the instance (populated for value-mismatch errors). */
  readonly actual?: string;
  /** One-line actionable suggestion for the coding agent. */
  readonly fix: string;
}

/** The validation result for a single generated file. */
export interface InstanceFileValidationResult {
  filename: string;
  instanceFilePath: string;
  templateFilePath: string;
  errors: ConformanceError[];
}

/** The validation result for a generated instance directory, grouping per-file results under the directory name. */
export interface InstanceDirectoryValidationResult {
  directoryName: string;
  results: InstanceFileValidationResult[];
}
