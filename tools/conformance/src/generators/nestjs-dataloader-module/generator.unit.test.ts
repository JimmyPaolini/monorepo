import { addProjectConfiguration } from "@nx/devkit";
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { beforeEach, describe, expect, it } from "vitest";

import { generateNestjsDataloaderModule } from "./generator";

import type { Tree } from "@nx/devkit";

const PROJECT_NAME = "my-app";
const PROJECT_ROOT = "applications/my-app";
const MODULES_DIR = `${PROJECT_ROOT}/src/modules`;

describe(generateNestjsDataloaderModule, () => {
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
    it("should generate all module files under a subfolder", async () => {
      await generateNestjsDataloaderModule(tree, {
        name: "post",
        project: PROJECT_NAME,
      });

      const base = `${MODULES_DIR}/post`;

      expect(tree.exists(`${base}/post.module.ts`)).toBe(true);
      expect(tree.exists(`${base}/post.dataloader.ts`)).toBe(true);
      expect(tree.exists(`${base}/post.dataloader.unit.test.ts`)).toBe(true);
      expect(tree.exists(`${base}/post.types.ts`)).toBe(true);
      expect(tree.exists(`${base}/post.constants.ts`)).toBe(true);
    });

    it("should use PascalCase class names in generated module file", async () => {
      await generateNestjsDataloaderModule(tree, {
        name: "post",
        project: PROJECT_NAME,
      });

      const content = tree.read(`${MODULES_DIR}/post/post.module.ts`, "utf8");

      expect(content).toContain("PostDataLoader");
      expect(content).toContain("PostModule");
    });
  });

  describe("name validation", () => {
    it("should throw when name is camelCase", async () => {
      await expect(
        generateNestjsDataloaderModule(tree, {
          name: "blogPost",
          project: PROJECT_NAME,
        }),
      ).rejects.toThrow(
        'Module name "blogPost" must be in kebab-case. Did you mean "blog-post"?',
      );
    });
  });
});
