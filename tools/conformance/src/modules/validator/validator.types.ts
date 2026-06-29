// 🏷️ Types

/** CLI option payload parsed by nest-commander. */
export interface ValidatorCommandOptions {
  projects?: string[];
  rules?: ValidatorRuleName[];
}

/** Per-project validation result payload. */
export interface ValidatorProjectResult {
  passed: boolean;
  projectName: string;
  projectRootPath: string;
  rules: ValidatorRuleResult[];
}

/** Input options for a validation request. */
export interface ValidatorRequest {
  projects?: string[];
  rules?: ValidatorRuleName[];
}

/** Top-level validation response payload. */
export interface ValidatorResult {
  generatedAt: string;
  passed: boolean;
  requestedProjects: string[];
  results: ValidatorProjectResult[];
  selectedRules: ValidatorRuleName[];
  summary: ValidatorSummary;
}

/** Allowed conformance validation rule names. */
export type ValidatorRuleName =
  | "nestjs-command-application"
  | "nestjs-command-module"
  | "nestjs-graphql-application"
  | "nestjs-graphql-module"
  | "nestjs-service-file"
  | "nestjs-service-module";

/** Per-rule validation result for a project. */
export interface ValidatorRuleResult {
  errors: string[];
  passed: boolean;
  rule: ValidatorRuleName;
  severity: ValidatorSeverity;
}

/** Severity level for a validation rule violation. */
export type ValidatorSeverity = "error" | "warning";

/** Aggregate validation counts across all projects. */
export interface ValidatorSummary {
  failedProjectCount: number;
  projectCount: number;
  violatedRuleCount: number;
}
