/** The casing convention to validate a name against. */
export const StringCase = {
  CAMEL_CASE: "CAMEL_CASE",
  PASCAL_CASE: "PASCAL_CASE",
  SNAKE_CASE: "SNAKE_CASE",
  KEBAB_CASE: "KEBAB_CASE",
} as const;

/** Union type of all supported casing conventions. */
export type StringCaseValue = (typeof StringCase)[keyof typeof StringCase];
