import _ from "lodash";

/** All pre-computed name variants for a given input name. */
export interface NameVariables {
  /** Index signature so this is assignable to `Record<string, string>`. */
  [key: string]: string;
  /** The name as-is (the folder name). */
  name: string;
  /** camelCase variant. */
  nameCamel: string;
  /** PascalCase variant. */
  namePascal: string;
  /** snake_case variant. */
  nameSnake: string;
  /** CONSTANT_CASE variant. */
  nameConstant: string;
  /** kebab-case variant. */
  nameKebab: string;
}

/**
 * Computes all pre-calculated name variants from the given input name.
 *
 * Since Mustache templates cannot call string-transform functions, callers
 * must pass the full variables object returned here when rendering templates.
 *
 * @param name - The raw folder/resource name (any case — kebab, camel, Pascal).
 */
export function nameVariables(name: string): NameVariables {
  const nameCamel = _.camelCase(name);
  const namePascal = _.upperFirst(nameCamel);
  const nameSnake = _.snakeCase(name);
  const nameConstant = nameSnake.toUpperCase();
  const nameKebab = _.kebabCase(name);

  return { name, nameCamel, namePascal, nameSnake, nameConstant, nameKebab };
}
