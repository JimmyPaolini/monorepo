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
