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

// ---------------------------------------------------------------------------
// ConformanceError — structured error type used by file-type-specific
// validators (JSON, Markdown, TypeScript via ts-morph).
// ---------------------------------------------------------------------------

/** The type of conformance error. */
export type ConformanceErrorKind =
  | "missing_file"
  | "unexpected_file"
  | "missing_export"
  | "missing_function"
  | "wrong_signature"
  | "missing_comment"
  | "wrong_comment"
  | "missing_key"
  | "wrong_value"
  | "missing_section"
  | "missing_cell"
  | "wrong_cell_type";

/** A single conformance error describing a mismatch between a template and an instance file. */
export interface ConformanceError {
  /** The category of the violation. */
  kind: ConformanceErrorKind;
  /** Relative path within the instance folder. */
  file: string;
  /** Concrete description of what was expected. */
  expected: string;
  /** Concrete description of what was found, or null if absent. */
  found: string | null;
  /** Source location of the violation in the instance file. */
  location?: {
    line: number;
    column: number;
  };
  /** Plain-language fix description written for a coding agent. */
  hint?: string;
}

/** Format a list of ConformanceErrors as a human-readable diagnostic string. */
export function formatConformanceErrors(
  folderPath: string,
  errors: ConformanceError[],
): string {
  const lines: string[] = [`CONFORMANCE FAILURE: ${folderPath}`, ""];
  for (const error of errors) {
    const kindTag = `[${error.kind}]`.padEnd(22);
    const location = error.location ? ` line ${error.location.line}` : "";
    lines.push(
      `${kindTag} ${error.file}${location}`,
      `                       Expected: ${error.expected}`,
      `                       Found:    ${error.found ?? "(none)"}`,
    );
    if (error.hint !== undefined) {
      lines.push(`                       Hint: ${error.hint}`);
    }
  }
  return lines.join("\n");
}
