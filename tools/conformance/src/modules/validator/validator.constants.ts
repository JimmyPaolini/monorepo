import { fileURLToPath } from "node:url";

import {
  APPLICATIONS_DIRECTORY,
  PACKAGES_DIRECTORY,
  TOOLS_DIRECTORY,
} from "../../constants";

import type { ValidatorRuleName, ValidatorSeverity } from "./validator.types";

// ♟️ Constants

const COMMAND_APPLICATION_TEMPLATES_DIRECTORY_PATH = fileURLToPath(
  new URL(
    "../../../../conformance/src/generators/nestjs-command-application/templates",
    import.meta.url,
  ),
);
const COMMAND_MODULE_TEMPLATES_DIRECTORY_PATH = fileURLToPath(
  new URL(
    "../../../../conformance/src/generators/nestjs-command-module/templates",
    import.meta.url,
  ),
);
const GRAPHQL_APPLICATION_TEMPLATES_DIRECTORY_PATH = fileURLToPath(
  new URL(
    "../../../../conformance/src/generators/nestjs-graphql-application/templates",
    import.meta.url,
  ),
);
const GRAPHQL_MODULE_TEMPLATES_DIRECTORY_PATH = fileURLToPath(
  new URL(
    "../../../../conformance/src/generators/nestjs-graphql-module/templates",
    import.meta.url,
  ),
);
const SERVICE_FILES_TEMPLATES_DIRECTORY_PATH = fileURLToPath(
  new URL(
    "../../../../conformance/src/generators/nestjs-service-file/templates",
    import.meta.url,
  ),
);
const SERVICE_MODULE_TEMPLATES_DIRECTORY_PATH = fileURLToPath(
  new URL(
    "../../../../conformance/src/generators/nestjs-service-module/templates",
    import.meta.url,
  ),
);

export const NESTJS_APPLICATION_TAG = "framework:nestjs";
export const NESTJS_COMMAND_APPLICATION_TAG = "framework:nest-commander";
export const NESTJS_COMMAND_APPLICATION_GENERATOR_TAG =
  "generator:nestjs-command-application";
export const NESTJS_GRAPHQL_APPLICATION_GENERATOR_TAG =
  "generator:nestjs-graphql-application";

export const DEFAULT_PROJECT_TYPE_TAGS = ["type:application", "type:component"];

export const DEFAULT_PROJECT_DIRECTORIES = [
  APPLICATIONS_DIRECTORY,
  PACKAGES_DIRECTORY,
  TOOLS_DIRECTORY,
] as const;

export const VALIDATOR_RULE_NAMES: ValidatorRuleName[] = [
  "nestjs-command-application",
  "nestjs-command-module",
  "nestjs-graphql-application",
  "nestjs-graphql-module",
  "nestjs-service-file",
  "nestjs-service-module",
];

export const VALIDATOR_RULE_SEVERITY: Record<
  ValidatorRuleName,
  ValidatorSeverity
> = {
  "nestjs-command-application": "error",
  "nestjs-command-module": "error",
  "nestjs-graphql-application": "error",
  "nestjs-graphql-module": "error",
  "nestjs-service-file": "error",
  "nestjs-service-module": "error",
};

const VALIDATOR_RULE_TEMPLATE_DIRECTORY: Record<ValidatorRuleName, string> = {
  "nestjs-command-application": COMMAND_APPLICATION_TEMPLATES_DIRECTORY_PATH,
  "nestjs-command-module": COMMAND_MODULE_TEMPLATES_DIRECTORY_PATH,
  "nestjs-graphql-application": GRAPHQL_APPLICATION_TEMPLATES_DIRECTORY_PATH,
  "nestjs-graphql-module": GRAPHQL_MODULE_TEMPLATES_DIRECTORY_PATH,
  "nestjs-service-file": SERVICE_FILES_TEMPLATES_DIRECTORY_PATH,
  "nestjs-service-module": SERVICE_MODULE_TEMPLATES_DIRECTORY_PATH,
};

export { VALIDATOR_RULE_TEMPLATE_DIRECTORY };

/** Type guard for validation rule names. */
export function isValidatorRuleName(value: string): value is ValidatorRuleName {
  for (const validatorRuleName of VALIDATOR_RULE_NAMES) {
    if (validatorRuleName === value) {
      return true;
    }
  }

  return false;
}
