import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  getValidatorTemplateDirectoryPath,
  isValidatorRuleName,
  VALIDATOR_RULE_NAMES,
} from "./validator.constants";

const INVALID_RULE_NAME = "unknown-rule";

function getTemplateDirectoryPathForTest(
  ruleName: string,
  workspaceRootPath: string,
): string | undefined {
  return isValidatorRuleName(ruleName)
    ? getValidatorTemplateDirectoryPath(ruleName, workspaceRootPath)
    : undefined;
}

describe("validator.constants", () => {
  it("covers every configured conformance generator with a validator rule", () => {
    const currentFilePath = fileURLToPath(import.meta.url);
    const generatorsFilePath = path.join(
      path.dirname(currentFilePath),
      "../../..",
      "generators.json",
    );
    const generatorsConfiguration = JSON.parse(
      fs.readFileSync(generatorsFilePath, "utf8"),
    ) as {
      generators: Record<string, unknown>;
    };

    const generatorNames = Object.keys(generatorsConfiguration.generators);
    const missingRules = generatorNames.filter(
      (generatorName) => !isValidatorRuleName(generatorName),
    );

    expect(missingRules).toStrictEqual([]);
  });

  it("resolves template directory path for known rules", () => {
    const workspaceRootPath = "/workspace";

    const result = getValidatorTemplateDirectoryPath(
      "nestjs-service-file",
      workspaceRootPath,
    );

    expect(result).toContain("/workspace/tools/conformance/src/modules");
    expect(result).toContain("nestjs-service-file/templates");
  });

  it("returns undefined path for unknown rule through fallback branch", () => {
    const workspaceRootPath = "/workspace";

    const result = getTemplateDirectoryPathForTest(
      INVALID_RULE_NAME,
      workspaceRootPath,
    );

    expect(result).toBeUndefined();
  });

  it("recognizes valid and invalid validator rule names", () => {
    expect(VALIDATOR_RULE_NAMES.length).toBeGreaterThan(0);
    expect(isValidatorRuleName("nestjs-command-module")).toBe(true);
    expect(isValidatorRuleName("not-a-rule")).toBe(false);
  });
});
