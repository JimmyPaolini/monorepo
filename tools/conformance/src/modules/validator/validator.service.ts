import { Injectable } from "@nestjs/common";
import { workspaceRoot } from "@nx/devkit";

import { LoggerService } from "../logger/logger.service";

import {
  VALIDATOR_RULE_NAMES,
  VALIDATOR_RULE_SEVERITY,
} from "./validator.constants";
import { stringifyConformanceErrors } from "./validator.files";
import { runRule } from "./validator.rules";
import {
  readWorkspaceProjects,
  resolveProjectByName,
  resolveProjectName,
  resolveSelectedProjectNames,
} from "./validator.workspace";

import type {
  ValidatorProjectResult,
  ValidatorRequest,
  ValidatorResult,
  ValidatorRuleName,
  ValidatorRuleResult,
} from "./validator.types";

/**
 * Orchestrates conformance validation for selected workspace projects.
 */
@Injectable()
export class ValidatorService {
  // 🏗 Dependency Injection

  constructor(logger: LoggerService) {
    const resolvedLogger = logger as LoggerService | undefined;
    this.logger = resolvedLogger ?? new LoggerService();
    (this.logger as LoggerService | undefined)?.setContext(
      ValidatorService.name,
    );
  }

  // 🔐 Private Fields

  private readonly logger: LoggerService;

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

  /**
   * Builds summary counts for top-level validation output.
   */
  private buildSummary(
    results: ValidatorProjectResult[],
  ): ValidatorResult["summary"] {
    const failedProjectCount = results.filter(
      (result) => !result.passed,
    ).length;
    const violatedRuleCount = results.reduce((count, result) => {
      return count + result.rules.filter((rule) => !rule.passed).length;
    }, 0);

    return {
      failedProjectCount,
      projectCount: results.length,
      violatedRuleCount,
    };
  }

  /**
   * Resolves validation rules from explicit input or the full default rule set.
   */
  private resolveSelectedRules(
    requestedRules: undefined | ValidatorRuleName[],
  ): ValidatorRuleName[] {
    if (requestedRules === undefined) {
      return VALIDATOR_RULE_NAMES;
    }

    const unknownRules = requestedRules.filter(
      (requestedRule) => !VALIDATOR_RULE_NAMES.includes(requestedRule),
    );
    if (unknownRules.length > 0) {
      throw new Error(`Unknown validation rules: ${unknownRules.join(", ")}`);
    }

    return requestedRules;
  }

  /**
   * Evaluates one validation rule against the project when the rule applies.
   */
  private validateRule(args: {
    ruleName: ValidatorRuleName;
    workspaceProject: { rootPath: string; tags: string[] };
  }): undefined | ValidatorRuleResult {
    const { ruleName, workspaceProject } = args;
    const resultsByRule = runRule({
      ruleName,
      workspaceProject,
    });

    if (resultsByRule === undefined) {
      return undefined;
    }

    const serializedErrors = stringifyConformanceErrors(resultsByRule);
    return {
      errors: serializedErrors === null ? [] : [serializedErrors],
      passed: serializedErrors === null,
      rule: ruleName,
      severity: VALIDATOR_RULE_SEVERITY[ruleName],
    };
  }

  /**
   * Runs conformance validation for the selected projects and rules.
   */
  async validate(request: ValidatorRequest): Promise<ValidatorResult> {
    const allWorkspaceProjects = await Promise.resolve(readWorkspaceProjects());
    const selectedProjectNames = resolveSelectedProjectNames({
      allWorkspaceProjects,
      requestedProjectNames: request.projects,
    });
    const selectedRules = this.resolveSelectedRules(request.rules);
    const selectedProjects = selectedProjectNames.map((projectName) =>
      resolveProjectByName({
        allWorkspaceProjects,
        projectName,
      }),
    );

    const results = selectedProjects.map((workspaceProject) => {
      const validatorRuleResults = selectedRules
        .map((ruleName) => this.validateRule({ ruleName, workspaceProject }))
        .filter(
          (validatorRuleResult): validatorRuleResult is ValidatorRuleResult =>
            validatorRuleResult !== undefined,
        );

      return {
        passed: validatorRuleResults.every((validatorRuleResult) => {
          return validatorRuleResult.passed;
        }),
        projectName: resolveProjectName(workspaceProject.rootPath),
        projectRootPath: workspaceProject.rootPath.replace(
          `${workspaceRoot}/`,
          "",
        ),
        rules: validatorRuleResults,
      };
    });

    return {
      generatedAt: new Date().toISOString(),
      passed: results.every((result) => result.passed),
      requestedProjects: selectedProjectNames,
      results,
      selectedRules,
      summary: this.buildSummary(results),
    };
  }
}
