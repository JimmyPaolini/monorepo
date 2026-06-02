import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { validateTypescriptConformance } from "@monorepo/conformance/src/validators/typescript/validator.js";
import { describe, expect, it } from "vitest";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const MONOREPO_ROOT = path.resolve(__dirname, "../../../../..");

describe("forms service conformance", () => {
  it("forms.service.ts should conform to the nestjs-service-module template", () => {
    const templatePath = path.join(
      MONOREPO_ROOT,
      "tools/conformance/src/generators/nestjs-service-module/templates/__nameCamelCase__.service.ts",
    );
    const instancePath = path.join(
      MONOREPO_ROOT,
      "applications/lexico-ingestion/src/modules/forms/forms.service.ts",
    );

    const template = fs.readFileSync(templatePath, "utf8");
    const instance = fs.readFileSync(instancePath, "utf8");

    const result = validateTypescriptConformance({
      instance,
      template,
      data: { nameCamelCase: "forms", namePascalCase: "Forms" },
      filename: "forms.service.ts",
    });

    expect(result.errors).toEqual([]);
  });
});
