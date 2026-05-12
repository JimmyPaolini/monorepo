import path from "node:path";
import { fileURLToPath } from "node:url";

import { MODULES_DIRECTORY } from "@monorepo/code-generator/src/generators/nestjs-service-module/generator";
import { validateGeneratedDirectory } from "@monorepo/code-generator/src/validators/conformance";
import _ from "lodash";
import { describe, expect, it } from "vitest";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const NESTJS_TEMPLATES_DIR = path.resolve(
  __dirname,
  "../../../../tools/code-generator/src/generators/nestjs-service-module/templates",
);

describe("nestjs-service-module template conformance", () => {
  it(`audits modules in ${MODULES_DIRECTORY} for template conformance drift`, () => {
    const allResults = validateGeneratedDirectory(
      __dirname,
      NESTJS_TEMPLATES_DIR,
      (name) => ({
        nameCamelCase: name,
        namePascalCase: _.upperFirst(name),
      }),
    );

    // Skip composite/empty directories where ALL template files are missing
    const results = allResults.filter(({ results: fileResults }) =>
      fileResults.some(({ errors }) =>
        errors.every((e) => !e.startsWith("File not found:")),
      ),
    );

    // Assert that no existing module file has drifted from the template structure
    const driftErrors: string[] = [];
    for (const { name, results: fileResults } of results) {
      for (const { file, valid, errors } of fileResults) {
        if (!valid && errors.every((e) => !e.startsWith("File not found:"))) {
          driftErrors.push(`${name}/${file}: ${errors.join("; ")}`);
        }
      }
    }

    // The validator ran and found at least some modules to audit
    expect(results.length).toBeGreaterThan(0);
    expect(
      driftErrors,
      `Template conformance drift detected:\n${driftErrors.map((d) => `  - ${d}`).join("\n")}`,
    ).toEqual([]);
  });
});
