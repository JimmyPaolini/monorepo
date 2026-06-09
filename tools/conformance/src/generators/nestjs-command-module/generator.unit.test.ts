import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { addProjectConfiguration } from "@nx/devkit";
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { beforeEach, describe, expect, it } from "vitest";

import { validateTypescriptConformance as validateConformance } from "../../validators/typescript/validator.js";

import { generateNestjsCommandModule } from "./generator";

import type { Tree } from "@nx/devkit";

const PROJECT_NAME = "my-app";
const PROJECT_ROOT = "applications/my-app";
const MODULES_DIR = `${PROJECT_ROOT}/src/modules`;

describe("generateNestjsCommandModule", () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    addProjectConfiguration(tree, PROJECT_NAME, {
      root: PROJECT_ROOT,
      tags: ["framework:nestjs", "framework:nest-commander"],
    });
    tree.write(`${MODULES_DIR}/.gitkeep`, "");
  });

  describe("file generation", () => {
    it("should generate all 5 module files under a subfolder", async () => {
      await generateNestjsCommandModule(tree, {
        name: "processor",
        project: PROJECT_NAME,
      });

      const base = `${MODULES_DIR}/processor`;
      expect(tree.exists(`${base}/processor.module.ts`)).toBeTruthy();
      expect(tree.exists(`${base}/processor.command.ts`)).toBeTruthy();
      expect(
        tree.exists(`${base}/processor.command.unit.test.ts`),
      ).toBeTruthy();
      expect(tree.exists(`${base}/processor.types.ts`)).toBeTruthy();
      expect(tree.exists(`${base}/processor.constants.ts`)).toBeTruthy();
    });

    it("should use camelCase for directory and file names from kebab-case input", async () => {
      await generateNestjsCommandModule(tree, {
        name: "my-command",
        project: PROJECT_NAME,
      });

      const base = `${MODULES_DIR}/my-command`;
      expect(tree.exists(`${base}/my-command.module.ts`)).toBeTruthy();
      expect(tree.exists(`${base}/my-command.command.ts`)).toBeTruthy();
    });

    it("should use PascalCase class names in generated module file", async () => {
      await generateNestjsCommandModule(tree, {
        name: "processor",
        project: PROJECT_NAME,
      });

      const moduleContent = tree.read(
        `${MODULES_DIR}/processor/processor.module.ts`,
        "utf8",
      );
      expect(moduleContent).toContain("ProcessorCommand");
      expect(moduleContent).toContain("ProcessorModule");
    });

    it("should use PascalCase class names in generated command file", async () => {
      await generateNestjsCommandModule(tree, {
        name: "processor",
        project: PROJECT_NAME,
      });

      const commandContent = tree.read(
        `${MODULES_DIR}/processor/processor.command.ts`,
        "utf8",
      );
      expect(commandContent).toContain("ProcessorCommand");
    });

    it("should include a TODO JSDoc comment in the generated module file", async () => {
      await generateNestjsCommandModule(tree, {
        name: "processor",
        project: PROJECT_NAME,
      });

      const moduleContent = tree.read(
        `${MODULES_DIR}/processor/processor.module.ts`,
        "utf8",
      );
      expect(moduleContent).toContain("TODO: Document the processor module.");
    });

    it("should include a TODO JSDoc comment in the generated command file", async () => {
      await generateNestjsCommandModule(tree, {
        name: "processor",
        project: PROJECT_NAME,
      });

      const commandContent = tree.read(
        `${MODULES_DIR}/processor/processor.command.ts`,
        "utf8",
      );
      expect(commandContent).toContain("TODO: Document the processor command.");
    });

    it("should conform to the command template structure", async () => {
      await generateNestjsCommandModule(tree, {
        name: "processor",
        project: PROJECT_NAME,
      });

      const commandContent =
        tree.read(`${MODULES_DIR}/processor/processor.command.ts`, "utf8") ??
        "";
      const __dirname = fileURLToPath(new URL(".", import.meta.url));
      const templateContent = fs.readFileSync(
        path.join(__dirname, "templates/__nameKebabCase__.command.ts"),
        "utf8",
      );
      const vars: Record<string, unknown> = {
        nameCamelCase: "processor",
        nameKebabCase: "processor",
        namePascalCase: "Processor",
      };
      const result = validateConformance({
        data: vars,
        filename: "processor.command.ts",
        instance: commandContent,
        template: templateContent,
      });
      expect(result.errors).toEqual([]);
      expect(result.errors.length === 0).toBe(true);
    });
  });

  describe("name validation", () => {
    it("should throw when name is camelCase", async () => {
      await expect(
        generateNestjsCommandModule(tree, {
          name: "myCommand",
          project: PROJECT_NAME,
        }),
      ).rejects.toThrow(
        'Module name "myCommand" must be in kebab-case. Did you mean "my-command"?',
      );
    });

    it("should throw when name is PascalCase", async () => {
      await expect(
        generateNestjsCommandModule(tree, {
          name: "Processor",
          project: PROJECT_NAME,
        }),
      ).rejects.toThrow(
        'Module name "Processor" must be in kebab-case. Did you mean "processor"?',
      );
    });
  });

  describe("project selection", () => {
    it("should throw when no framework:nest-commander projects exist in the workspace", async () => {
      const emptyTree = createTreeWithEmptyWorkspace();
      addProjectConfiguration(emptyTree, "no-tag-app", {
        root: "applications/no-tag-app",
        tags: ["language:typescript"],
      });

      await expect(
        generateNestjsCommandModule(emptyTree, {
          name: "processor",
          project: "no-tag-app",
        }),
      ).rejects.toThrow(
        'No projects with tag "framework:nest-commander" found in the workspace',
      );
    });

    it("should throw when specified project does not have the framework:nest-commander tag", async () => {
      addProjectConfiguration(tree, "non-nestjs-app", {
        root: "applications/non-nestjs-app",
        tags: ["language:typescript"],
      });

      await expect(
        generateNestjsCommandModule(tree, {
          name: "processor",
          project: "non-nestjs-app",
        }),
      ).rejects.toThrow(
        'Project "non-nestjs-app" does not have the "framework:nest-commander" tag.',
      );
    });
  });
});
