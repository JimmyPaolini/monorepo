import _ from "lodash";

import {
  APPLICATIONS_DIRECTORY,
  PACKAGES_DIRECTORY,
  TOOLS_DIRECTORY,
} from "../../constants";

import type {
  StringCaseValue,
  ValidatorRuleName,
  ValidatorSeverity,
} from "./validator.types";

// ♟️ Constants

const COMMAND_APPLICATION_TEMPLATES_DIRECTORY_RELATIVE_PATH =
  "tools/conformance/src/modules/nestjs-command-application/templates";
const COMMAND_MODULE_TEMPLATES_DIRECTORY_RELATIVE_PATH =
  "tools/conformance/src/modules/nestjs-command-module/templates";
const DATALOADER_MODULE_TEMPLATES_DIRECTORY_RELATIVE_PATH =
  "tools/conformance/src/modules/nestjs-dataloader-module/templates";
const JUPYTER_NOTEBOOK_APPLICATION_TEMPLATES_DIRECTORY_RELATIVE_PATH =
  "tools/conformance/src/modules/jupyter-notebook-application/templates";
const GRAPHQL_APPLICATION_TEMPLATES_DIRECTORY_RELATIVE_PATH =
  "tools/conformance/src/modules/nestjs-graphql-application/templates";
const GRAPHQL_MODULE_TEMPLATES_DIRECTORY_RELATIVE_PATH =
  "tools/conformance/src/modules/nestjs-graphql-module/templates";
const REACT_COMPONENT_TEMPLATES_DIRECTORY_RELATIVE_PATH =
  "tools/conformance/src/modules/react-component/templates";
const SERVICE_FILES_TEMPLATES_DIRECTORY_RELATIVE_PATH =
  "tools/conformance/src/modules/nestjs-service-file/templates";
const SERVICE_MODULE_TEMPLATES_DIRECTORY_RELATIVE_PATH =
  "tools/conformance/src/modules/nestjs-service-module/templates";

export const NESTJS_APPLICATION_TAG = "framework:nestjs";
export const NESTJS_COMMAND_APPLICATION_TAG = "framework:nest-commander";
export const REACT_PROJECT_TAG = "framework:react";
export const NESTJS_COMMAND_APPLICATION_GENERATOR_TAG =
  "generator:nestjs-command-application";
export const NESTJS_GRAPHQL_APPLICATION_GENERATOR_TAG =
  "generator:nestjs-graphql-application";
export const JUPYTER_NOTEBOOK_APPLICATION_GENERATOR_TAG =
  "generator:jupyter-notebook-application";

export const DEFAULT_PROJECT_TYPE_TAGS = ["type:application", "type:component"];

export const DEFAULT_PROJECT_DIRECTORIES = [
  APPLICATIONS_DIRECTORY,
  PACKAGES_DIRECTORY,
  TOOLS_DIRECTORY,
] as const;

/** The casing convention to validate a name against. */
export const StringCase = {
  CAMEL_CASE: "CAMEL_CASE",
  KEBAB_CASE: "KEBAB_CASE",
  PASCAL_CASE: "PASCAL_CASE",
  SNAKE_CASE: "SNAKE_CASE",
} as const;

/** Maps each StringCaseValue to a function that converts a string to that casing. */
export const converterByStringCase: Record<
  StringCaseValue,
  (value: string) => string
> = {
  [StringCase.CAMEL_CASE]: (v) => _.camelCase(v),
  [StringCase.KEBAB_CASE]: (v) => _.kebabCase(v),
  [StringCase.PASCAL_CASE]: (v) => _.upperFirst(_.camelCase(v)),
  [StringCase.SNAKE_CASE]: (v) => _.snakeCase(v),
};

export const VALIDATOR_RULE_NAMES: ValidatorRuleName[] = [
  "jupyter-notebook-application",
  "nestjs-command-application",
  "nestjs-command-module",
  "nestjs-dataloader-module",
  "nestjs-graphql-application",
  "nestjs-graphql-module",
  "react-component",
  "nestjs-service-file",
  "nestjs-service-module",
];

export const VALIDATOR_RULE_SEVERITY: Record<
  ValidatorRuleName,
  ValidatorSeverity
> = {
  "jupyter-notebook-application": "error",
  "nestjs-command-application": "error",
  "nestjs-command-module": "error",
  "nestjs-dataloader-module": "error",
  "nestjs-graphql-application": "error",
  "nestjs-graphql-module": "error",
  "nestjs-service-file": "error",
  "nestjs-service-module": "error",
  "react-component": "error",
};

const VALIDATOR_RULE_TEMPLATE_DIRECTORY_RELATIVE_PATH: Record<
  ValidatorRuleName,
  string
> = {
  "jupyter-notebook-application":
    JUPYTER_NOTEBOOK_APPLICATION_TEMPLATES_DIRECTORY_RELATIVE_PATH,
  "nestjs-command-application":
    COMMAND_APPLICATION_TEMPLATES_DIRECTORY_RELATIVE_PATH,
  "nestjs-command-module": COMMAND_MODULE_TEMPLATES_DIRECTORY_RELATIVE_PATH,
  "nestjs-dataloader-module":
    DATALOADER_MODULE_TEMPLATES_DIRECTORY_RELATIVE_PATH,
  "nestjs-graphql-application":
    GRAPHQL_APPLICATION_TEMPLATES_DIRECTORY_RELATIVE_PATH,
  "nestjs-graphql-module": GRAPHQL_MODULE_TEMPLATES_DIRECTORY_RELATIVE_PATH,
  "nestjs-service-file": SERVICE_FILES_TEMPLATES_DIRECTORY_RELATIVE_PATH,
  "nestjs-service-module": SERVICE_MODULE_TEMPLATES_DIRECTORY_RELATIVE_PATH,
  "react-component": REACT_COMPONENT_TEMPLATES_DIRECTORY_RELATIVE_PATH,
};

/**
 * Returns the absolute path to a template directory for the given rule.
 */
export function getValidatorTemplateDirectoryPath(
  ruleName: ValidatorRuleName,
  workspaceRoot: string,
): string {
  const relativePath =
    VALIDATOR_RULE_TEMPLATE_DIRECTORY_RELATIVE_PATH[ruleName];
  return relativePath
    ? `${workspaceRoot}/${relativePath}`
    : VALIDATOR_RULE_TEMPLATE_DIRECTORY_RELATIVE_PATH[ruleName];
}

/** Type guard for validation rule names. */
export function isValidatorRuleName(value: string): value is ValidatorRuleName {
  for (const validatorRuleName of VALIDATOR_RULE_NAMES) {
    if (validatorRuleName === value) {
      return true;
    }
  }

  return false;
}
