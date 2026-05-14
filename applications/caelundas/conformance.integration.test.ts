import path from "node:path";
import { fileURLToPath } from "node:url";

import { MODULES_DIRECTORY } from "@monorepo/code-generator/src/generators/nestjs-service-module/generator";
import { validateGeneratedDirectory } from "@monorepo/code-generator/src/validators/validator";
import _ from "lodash";
import { describe, expect, it } from "vitest";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const NESTJS_TEMPLATES_DIR = path.resolve(
  __dirname,
  "../../tools/code-generator/src/generators/nestjs-service-module/templates",
);

describe("nestjs-service-module template conformance", () => {
  it(`audits modules in ${MODULES_DIRECTORY} for template conformance drift`, () => {
    const allResults = validateGeneratedDirectory(
      path.join(__dirname, "src/modules"),
      NESTJS_TEMPLATES_DIR,
      (name) => ({
        nameCamelCase: name,
        namePascalCase: _.upperFirst(name),
      }),
    );

    // Skip composite/empty directories where ALL template files are missing
    const results = allResults.filter(({ results: fileResults }) =>
      fileResults.some(({ errors }) =>
        errors.every((error) => !error.startsWith("File not found:")),
      ),
    );

    // Assert that no existing module file has drifted from the template structure.
    //
    // Skipping rules:
    //  - Only validate .service.ts and .module.ts — test, types, and constants files
    //    change freely and are not subject to template conformance enforcement.
    //  - Skip service files where every error is a missing section marker. These
    //    modules predate template standardization; they were never generated from
    //    the current template and should not be flagged as drift.
    const VALIDATED_SUFFIXES = [".service.ts", ".module.ts"];
    const SECTION_MARKER_ERRORS = new Set([
      'Missing template code: "// 🔐 Private Fields"',
      'Missing template code: "// 🔑 Public Fields"',
      'Missing template code: "// 🔏 Private Methods"',
      'Missing template code: "// 🌎 Public Methods"',
    ]);

    const driftErrors: string[] = [];
    for (const { name, results: fileResults } of results) {
      for (const { file, valid, errors } of fileResults) {
        if (!VALIDATED_SUFFIXES.some((suffix) => file.endsWith(suffix)))
          continue;
        if (!valid && errors.every((e) => !e.startsWith("File not found:"))) {
          if (
            file.endsWith(".service.ts") &&
            errors.every((e) => SECTION_MARKER_ERRORS.has(e))
          )
            continue;
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
