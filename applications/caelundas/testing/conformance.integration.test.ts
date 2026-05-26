import { fileURLToPath } from "node:url";

import { TEMPLATES_DIRECTORY_PATH } from "@monorepo/conformance/src/generators/nestjs-command-application/generator";
import {
  collectConformanceErrors,
  validateInstanceDirectory,
} from "@monorepo/conformance/src/validators/typescript/files";
import { describe, expect, it } from "vitest";

describe(`"nestjs-command-application" generator template conformance`, () => {
  it(`validates application root against template`, () => {
    const result = validateInstanceDirectory({
      instanceDirectoryPath: fileURLToPath(new URL("..", import.meta.url)),
      templateDirectoryPath: TEMPLATES_DIRECTORY_PATH,
    });

    const errors = collectConformanceErrors([result]);
    expect(errors).toBeNull();
  });
});
