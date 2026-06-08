import { expect } from "vitest";

import type { ConformanceError } from "./types";

/**
 * Type-safe helper for asserting error messages in Vitest expectations.
 * Ensures that the `.message` property is properly typed when checking error arrays.
 */
export function expectErrorWithMessage(
  errors: ConformanceError[],
  message: RegExp | string,
): void {
  const hasMatchingError = errors.some((error) => {
    if (typeof message === "string") {
      return error.message.includes(message);
    }
    return message.test(error.message);
  });

  expect(hasMatchingError).toBe(true);
}
