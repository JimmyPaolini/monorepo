/**
 *
 */
export function flattenForms(
  obj: string[] | Record<string, unknown> | null | undefined,
): string[] {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj;
  return Object.values(obj).reduce<string[]>(
    (acc, val) => [
      ...acc,
      ...flattenForms(val as string[] | Record<string, unknown>),
    ],
    [],
  );
}

/**
 *
 */
export function isNumber(str: string): boolean {
  return /^((singular)|(plural))$/i.test(str);
}

/**
 *
 */
export function isCase(str: string): boolean {
  return /^((nominative)|(genitive)|(dative)|(accusative)|(ablative)|(vocative)|(locative))$/i.test(
    str,
  );
}

/**
 *
 */
export function isGender(str: string): boolean {
  return /^((masculine)|(feminine)|(neuter))$/i.test(str);
}
