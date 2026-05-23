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
