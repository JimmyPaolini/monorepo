import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { addProjectConfiguration } from "@nx/devkit";
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { beforeEach, describe, expect, it } from "vitest";

import { validateTypescriptConformance as validateConformance } from "../../validators/typescript/validator.js";

import { generateNestjsServiceModule } from "./generator";

import type { Tree } from "@nx/devkit";

const PROJECT_NAME = "my-app";
const PROJECT_ROOT = "applications/my-app";
const MODULES_DIR = `${PROJECT_ROOT}/src/modules`;

describe("generateNestjsServiceModule", () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    addProjectConfiguration(tree, PROJECT_NAME, {
      root: PROJECT_ROOT,
      tags: ["framework:nestjs"],
    });
    tree.write(`${MODULES_DIR}/.gitkeep`, "");
  });

  describe("file generation", () => {
    it("should generate all 5 module files under a subfolder", async () => {
      await generateNestjsServiceModule(tree, {
        name: "calculator",
        project: PROJECT_NAME,
      });

      const base = `${MODULES_DIR}/calculator`;
      expect(tree.exists(`${base}/calculator.module.ts`)).toBeTruthy();
      expect(tree.exists(`${base}/calculator.service.ts`)).toBeTruthy();
      expect(
        tree.exists(`${base}/calculator.service.unit.test.ts`),
      ).toBeTruthy();
      expect(tree.exists(`${base}/calculator.types.ts`)).toBeTruthy();
      expect(tree.exists(`${base}/calculator.constants.ts`)).toBeTruthy();
    });

    it("should use camelCase for directory and file names from kebab-case input", async () => {
      await generateNestjsServiceModule(tree, {
        name: "my-service",
        project: PROJECT_NAME,
      });

      const base = `${MODULES_DIR}/my-service`;
      expect(tree.exists(`${base}/my-service.module.ts`)).toBeTruthy();
      expect(tree.exists(`${base}/my-service.service.ts`)).toBeTruthy();
    });

    it("should use PascalCase class names in generated module file", async () => {
      await generateNestjsServiceModule(tree, {
        name: "calculator",
        project: PROJECT_NAME,
      });

      const moduleContent = tree.read(
        `${MODULES_DIR}/calculator/calculator.module.ts`,
        "utf8",
      );
      expect(moduleContent).toContain("CalculatorService");
      expect(moduleContent).toContain("CalculatorModule");
    });

    it("should use PascalCase class names in generated service file", async () => {
      await generateNestjsServiceModule(tree, {
        name: "calculator",
        project: PROJECT_NAME,
      });

      const serviceContent = tree.read(
        `${MODULES_DIR}/calculator/calculator.service.ts`,
        "utf8",
      );
      expect(serviceContent).toContain("CalculatorService");
    });

    it("should include a TODO JSDoc comment in the generated module file", async () => {
      await generateNestjsServiceModule(tree, {
        name: "calculator",
        project: PROJECT_NAME,
      });

      const moduleContent = tree.read(
        `${MODULES_DIR}/calculator/calculator.module.ts`,
        "utf8",
      );
      expect(moduleContent).toContain("TODO: Document the calculator module.");
    });

    it("should include a TODO JSDoc comment in the generated service file", async () => {
      await generateNestjsServiceModule(tree, {
        name: "calculator",
        project: PROJECT_NAME,
      });

      const serviceContent = tree.read(
        `${MODULES_DIR}/calculator/calculator.service.ts`,
        "utf8",
      );
      expect(serviceContent).toContain(
        "TODO: Document the calculator service.",
      );
    });

    it("should conform to the service template structure", async () => {
      await generateNestjsServiceModule(tree, {
        name: "calculator",
        project: PROJECT_NAME,
      });

      const serviceContent =
        tree.read(`${MODULES_DIR}/calculator/calculator.service.ts`, "utf8") ??
        "";
      const __dirname = fileURLToPath(new URL(".", import.meta.url));
      const templateContent = fs.readFileSync(
        path.join(__dirname, "templates/__nameKebabCase__.service.ts"),
        "utf8",
      );
      const variables: Record<string, unknown> = {
        nameCamelCase: "calculator",
        namePascalCase: "Calculator",
      };
      const result = validateConformance({
        data: variables,
        filename: "calculator.service.ts",
        instance: serviceContent,
        template: templateContent,
      });
      expect(result.errors).toEqual([]);
      expect(result.errors.length === 0).toBe(true);
    });
  });

  describe("name validation", () => {
    it("should throw when name is camelCase", async () => {
      await expect(
        generateNestjsServiceModule(tree, {
          name: "myService",
          project: PROJECT_NAME,
        }),
      ).rejects.toThrow(
        'Module name "myService" must be in kebab-case. Did you mean "my-service"?',
      );
    });

    it("should throw when name is PascalCase", async () => {
      await expect(
        generateNestjsServiceModule(tree, {
          name: "Calculator",
          project: PROJECT_NAME,
        }),
      ).rejects.toThrow(
        'Module name "Calculator" must be in kebab-case. Did you mean "calculator"?',
      );
    });
  });

  describe("project selection", () => {
    it("should throw when no framework:nestjs projects exist in the workspace", async () => {
      const emptyTree = createTreeWithEmptyWorkspace();
      addProjectConfiguration(emptyTree, "no-tag-app", {
        root: "applications/no-tag-app",
        tags: ["language:typescript"],
      });

      await expect(
        generateNestjsServiceModule(emptyTree, {
          name: "calculator",
          project: "no-tag-app",
        }),
      ).rejects.toThrow(
        'No projects with tag "framework:nestjs" found in the workspace',
      );
    });

    it("should throw when specified project does not have the framework:nestjs tag", async () => {
      addProjectConfiguration(tree, "non-nestjs-app", {
        root: "applications/non-nestjs-app",
        tags: ["language:typescript"],
      });

      await expect(
        generateNestjsServiceModule(tree, {
          name: "calculator",
          project: "non-nestjs-app",
        }),
      ).rejects.toThrow(
        'Project "non-nestjs-app" does not have the "framework:nestjs" tag.',
      );
    });

    it("should throw when src/modules directory does not exist in the project", async () => {
      addProjectConfiguration(tree, "nestjs-no-modules", {
        root: "applications/nestjs-no-modules",
        tags: ["framework:nestjs"],
      });

      await expect(
        generateNestjsServiceModule(tree, {
          name: "calculator",
          project: "nestjs-no-modules",
        }),
      ).rejects.toThrow(
        'Directory "applications/nestjs-no-modules/src/modules" does not exist in project "nestjs-no-modules"',
      );
    });
  });
});
