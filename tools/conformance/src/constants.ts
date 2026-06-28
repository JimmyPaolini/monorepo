import _ from "lodash";

import { StringCase, type StringCaseValue } from "./types";

export const APPLICATIONS_DIRECTORY = "applications";
export const PACKAGES_DIRECTORY = "packages";
export const TOOLS_DIRECTORY = "tools";
export const MODULES_DIRECTORY = "src/modules";

/** Allowed destination root directories for generated command applications. */
export const DESTINATION_ROOTS = [
  APPLICATIONS_DIRECTORY,
  PACKAGES_DIRECTORY,
  TOOLS_DIRECTORY,
] as const;

/** Union type of valid destination root directory names. */
export type DestinationRoot = (typeof DESTINATION_ROOTS)[number];

const TEMPLATE_PATTERN = "tools/conformance/src/generators/**/templates/**";
const CONFORMANCE_INSTANCE_DIRECTORIES = DESTINATION_ROOTS;
const MODULES_INSTANCE_PATTERNS = CONFORMANCE_INSTANCE_DIRECTORIES.map(
  (directoryName) => `${directoryName}/**/${MODULES_DIRECTORY}/**`,
);
const INSTANCE_PATTERNS = CONFORMANCE_INSTANCE_DIRECTORIES.map(
  (directoryName) => `${directoryName}/**`,
);

export const CONFORMANCE_PATTERNS = [
  TEMPLATE_PATTERN,
  ...MODULES_INSTANCE_PATTERNS,
  ...INSTANCE_PATTERNS,
] as const;

/** Maps each StringCaseValue to its human-readable display name. */
export const humanReadableStringCase: Record<StringCaseValue, string> = {
  [StringCase.CAMEL_CASE]: "camelCase",
  [StringCase.KEBAB_CASE]: "kebab-case",
  [StringCase.PASCAL_CASE]: "PascalCase",
  [StringCase.SNAKE_CASE]: "snake_case",
};

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
