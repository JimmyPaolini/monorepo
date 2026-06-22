import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { addProjectConfiguration } from "@nx/devkit";
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { beforeEach, describe, expect, it } from "vitest";

import { validateTypescriptConformance as validateConformance } from "../../validators/typescript/validator";

import { generateNestjsGraphqlModule } from "./generator";

import type { Tree } from "@nx/devkit";

const PROJECT_NAME = "my-app";
const PROJECT_ROOT = "applications/my-app";
const MODULES_DIR = `${PROJECT_ROOT}/src/modules`;

describe(generateNestjsGraphqlModule, () => {
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
    it("should generate all 7 module files under a subfolder", async () => {
      await generateNestjsGraphqlModule(tree, {
        name: "post",
        project: PROJECT_NAME,
      });

      const base = `${MODULES_DIR}/post`;

      expect(tree.exists(`${base}/post.module.ts`)).toBe(true);
      expect(tree.exists(`${base}/post.resolver.ts`)).toBe(true);
      expect(tree.exists(`${base}/post.resolver.unit.test.ts`)).toBe(true);
      expect(tree.exists(`${base}/post.entities.ts`)).toBe(true);
      expect(tree.exists(`${base}/post.factories.ts`)).toBe(true);
      expect(tree.exists(`${base}/post.types.ts`)).toBe(true);
      expect(tree.exists(`${base}/post.constants.ts`)).toBe(true);
    });

    it("should handle multi-word kebab-case names", async () => {
      await generateNestjsGraphqlModule(tree, {
        name: "blog-post",
        project: PROJECT_NAME,
      });

      const base = `${MODULES_DIR}/blog-post`;

      expect(tree.exists(`${base}/blog-post.module.ts`)).toBe(true);
      expect(tree.exists(`${base}/blog-post.resolver.ts`)).toBe(true);
    });

    it("should use PascalCase class names in generated module file", async () => {
      await generateNestjsGraphqlModule(tree, {
        name: "post",
        project: PROJECT_NAME,
      });

      const content = tree.read(`${MODULES_DIR}/post/post.module.ts`, "utf8");

      expect(content).toContain("PostService");
      expect(content).toContain("PostResolver");
      expect(content).toContain("PostModule");
    });

    it("should use PascalCase class names in generated resolver file", async () => {
      await generateNestjsGraphqlModule(tree, {
        name: "post",
        project: PROJECT_NAME,
      });

      const content = tree.read(`${MODULES_DIR}/post/post.resolver.ts`, "utf8");

      expect(content).toContain("PostResolver");
      expect(content).toContain("PostService");
    });

    it("should use PascalCase class names in generated entities file", async () => {
      await generateNestjsGraphqlModule(tree, {
        name: "post",
        project: PROJECT_NAME,
      });

      const content = tree.read(`${MODULES_DIR}/post/post.entities.ts`, "utf8");

      expect(content).toContain("Post");
    });

    it("should use PascalCase class names in generated factories file", async () => {
      await generateNestjsGraphqlModule(tree, {
        name: "post",
        project: PROJECT_NAME,
      });

      const content = tree.read(
        `${MODULES_DIR}/post/post.factories.ts`,
        "utf8",
      );

      expect(content).toContain("CreatePostInput");
      expect(content).toContain("UpdatePostInput");
      expect(content).toContain("DeletePostInput");
      expect(content).toContain("FindPostArgs");
    });

    it("should include a TODO JSDoc comment in the generated module file", async () => {
      await generateNestjsGraphqlModule(tree, {
        name: "post",
        project: PROJECT_NAME,
      });

      const content = tree.read(`${MODULES_DIR}/post/post.module.ts`, "utf8");

      expect(content).toContain("TODO: Document the post module.");
    });

    it("should conform to the resolver template structure", async () => {
      await generateNestjsGraphqlModule(tree, {
        name: "post",
        project: PROJECT_NAME,
      });

      const resolverContent =
        tree.read(`${MODULES_DIR}/post/post.resolver.ts`, "utf8") ?? "";
      const __dirname = fileURLToPath(new URL(".", import.meta.url));
      const templateContent = fs.readFileSync(
        path.join(__dirname, "templates/__nameKebabCase__.resolver.ts"),
        "utf8",
      );
      const variables: Record<string, unknown> = {
        nameCamelCase: "post",
        nameKebabCase: "post",
        namePascalCase: "Post",
      };
      const result = validateConformance({
        data: variables,
        filename: "post.resolver.ts",
        instance: resolverContent,
        template: templateContent,
      });

      expect(result.errors).toStrictEqual([]);
    });
  });

  describe("name validation", () => {
    it("should throw when name is camelCase", async () => {
      await expect(
        generateNestjsGraphqlModule(tree, {
          name: "blogPost",
          project: PROJECT_NAME,
        }),
      ).rejects.toThrow(
        'Module name "blogPost" must be in kebab-case. Did you mean "blog-post"?',
      );
    });

    it("should throw when name is PascalCase", async () => {
      await expect(
        generateNestjsGraphqlModule(tree, {
          name: "Post",
          project: PROJECT_NAME,
        }),
      ).rejects.toThrow(
        'Module name "Post" must be in kebab-case. Did you mean "post"?',
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
        generateNestjsGraphqlModule(emptyTree, {
          name: "post",
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
        generateNestjsGraphqlModule(tree, {
          name: "post",
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
        generateNestjsGraphqlModule(tree, {
          name: "post",
          project: "nestjs-no-modules",
        }),
      ).rejects.toThrow(
        'Directory "applications/nestjs-no-modules/src/modules" does not exist in project "nestjs-no-modules"',
      );
    });
  });
});
