import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { addProjectConfiguration } from "@nx/devkit";
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { beforeEach, describe, expect, it } from "vitest";

import { validateTypescriptConformance as validateConformance } from "../../validators/typescript/validator";

import { generateNestjsServiceFile } from "./generator";

import type { Tree } from "@nx/devkit";

const PROJECT_NAME = "my-app";
const PROJECT_ROOT = "applications/my-app";
const MODULES_DIR = `${PROJECT_ROOT}/src/modules`;
const TARGET_MODULE = "shared";

describe("generateNestjsServiceFile", () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    addProjectConfiguration(tree, PROJECT_NAME, {
      root: PROJECT_ROOT,
      tags: ["framework:nestjs"],
    });
    tree.write(`${MODULES_DIR}/.gitkeep`, "");
    tree.write(
      `${MODULES_DIR}/${TARGET_MODULE}/${TARGET_MODULE}.module.ts`,
      "",
    );
  });

  describe("file generation", () => {
    it("should generate service and unit test files under a subfolder", async () => {
      await generateNestjsServiceFile(tree, {
        module: TARGET_MODULE,
        name: "calculator",
        project: PROJECT_NAME,
      });

      const base = `${MODULES_DIR}/${TARGET_MODULE}`;
      expect(tree.exists(`${base}/calculator.service.ts`)).toBeTruthy();
      expect(
        tree.exists(`${base}/calculator.service.unit.test.ts`),
      ).toBeTruthy();
    });

    it("should use PascalCase class names in generated service file", async () => {
      await generateNestjsServiceFile(tree, {
        module: TARGET_MODULE,
        name: "calculator",
        project: PROJECT_NAME,
      });

      const serviceContent = tree.read(
        `${MODULES_DIR}/${TARGET_MODULE}/calculator.service.ts`,
        "utf8",
      );
      expect(serviceContent).toContain("CalculatorService");
    });

    it("should conform to the service template structure", async () => {
      await generateNestjsServiceFile(tree, {
        module: TARGET_MODULE,
        name: "calculator",
        project: PROJECT_NAME,
      });

      const serviceContent =
        tree.read(
          `${MODULES_DIR}/${TARGET_MODULE}/calculator.service.ts`,
          "utf8",
        ) ?? "";
      const __dirname = fileURLToPath(new URL(".", import.meta.url));
      const templateContent = fs.readFileSync(
        path.join(__dirname, "templates/__nameKebabCase__.service.ts"),
        "utf8",
      );
      const variables: Record<string, unknown> = {
        nameCamelCase: "calculator",
        nameKebabCase: "calculator",
        namePascalCase: "Calculator",
      };
      const result = validateConformance({
        data: variables,
        filename: "calculator.service.ts",
        instance: serviceContent,
        template: templateContent,
      });
      expect(result.errors).toEqual([]);
    });
  });

  describe("name validation", () => {
    it("should throw when name is camelCase", async () => {
      await expect(
        generateNestjsServiceFile(tree, {
          module: TARGET_MODULE,
          name: "myService",
          project: PROJECT_NAME,
        }),
      ).rejects.toThrow(
        'Service name "myService" must be in kebab-case. Did you mean "my-service"?',
      );
    });
  });

  describe("project selection", () => {
    it("should throw when specified project does not have the framework:nestjs tag", async () => {
      addProjectConfiguration(tree, "non-nestjs-app", {
        root: "applications/non-nestjs-app",
        tags: ["language:typescript"],
      });

      await expect(
        generateNestjsServiceFile(tree, {
          module: TARGET_MODULE,
          name: "calculator",
          project: "non-nestjs-app",
        }),
      ).rejects.toThrow(
        'Project "non-nestjs-app" does not have the "framework:nestjs" tag.',
      );
    });
  });

  describe("module selection", () => {
    it("should throw when specified module does not exist in the selected project", async () => {
      await expect(
        generateNestjsServiceFile(tree, {
          module: "missing-module",
          name: "calculator",
          project: PROJECT_NAME,
        }),
      ).rejects.toThrow(
        `Module "missing-module" does not exist in "${MODULES_DIR}". Available modules: ${TARGET_MODULE}`,
      );
    });
  });
});
