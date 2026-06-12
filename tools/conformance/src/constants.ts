import _ from "lodash";

import { StringCase, type StringCaseValue } from "./types.js";

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
