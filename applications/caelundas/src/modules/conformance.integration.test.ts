import { fileURLToPath } from "node:url";

import {
  MODULES_DIRECTORY,
  TEMPLATES_DIRECTORY_PATH,
} from "@monorepo/code-generator/src/generators/nestjs-service-module/generator";
import {
  collectConformanceErrors,
  validateInstancesDirectory,
} from "@monorepo/code-generator/src/validators/validator";
import { describe, expect, it } from "vitest";

describe(`"nestjs-service-module" generator template conformance`, () => {
  it(`validates directory "${MODULES_DIRECTORY}"`, () => {
    const results = validateInstancesDirectory({
      instancesDirectoryPath: fileURLToPath(new URL(".", import.meta.url)),
      templateDirectoryPath: TEMPLATES_DIRECTORY_PATH,
    });
    expect(results.length).toBeGreaterThan(0);

    const errors = collectConformanceErrors(results);
    expect(
      errors,
      `"nestjs-service-module" generator template conformance validation errors:\n${errors}`,
    ).toBeNull();
  });
});
