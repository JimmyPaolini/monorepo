import { Injectable } from "@nestjs/common";
import { workspaceRoot } from "@nx/devkit";

import { LoggerService } from "../logger/logger.service";

import { ValidatorFilesService } from "./validator-files.service";
import { ValidatorRulesService } from "./validator-rules.service";
import { ValidatorWorkspaceService } from "./validator-workspace.service";
import {
  isValidatorRuleName,
  VALIDATOR_RULE_NAMES,
  VALIDATOR_RULE_SEVERITY,
} from "./validator.constants";

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

  constructor(
    logger: LoggerService | undefined,
    private readonly validatorFilesService: ValidatorFilesService,
    private readonly validatorRulesService: ValidatorRulesService,
    private readonly validatorWorkspaceService: ValidatorWorkspaceService,
  ) {
    this.logger = logger ?? new LoggerService();
    this.logger.setContext(ValidatorService.name);
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
    const resultsByRule = this.validatorRulesService.runRule({
      ruleName,
      workspaceProject,
    });

    if (resultsByRule === undefined) {
      return undefined;
    }

    const serializedErrors =
      this.validatorFilesService.stringifyConformanceErrors(resultsByRule);
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
    const allWorkspaceProjects = await Promise.resolve(
      this.validatorWorkspaceService.readWorkspaceProjects(),
    );
    const selectedProjectNames =
      this.validatorWorkspaceService.resolveSelectedProjectNames({
        allWorkspaceProjects,
        requestedProjectNames: request.projects,
      });
    const requestedRules = request.rules;
    const selectedRequestedRules = requestedRules?.filter((ruleName) =>
      isValidatorRuleName(ruleName),
    );
    const selectedRules = this.resolveSelectedRules(selectedRequestedRules);
    const selectedProjects = selectedProjectNames.map((projectName) =>
      this.validatorWorkspaceService.resolveProjectByName({
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
        projectName: this.validatorWorkspaceService.resolveProjectName(
          workspaceProject.rootPath,
        ),
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
