import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { addProjectConfiguration } from "@nx/devkit";
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { StringCase } from "./types";
import {
  generateFiles,
  getProjectsWithTag,
  resolveName,
  resolveProject,
} from "./utilities.js";

import type { Tree } from "@nx/devkit";

describe("getProjectsWithTag", () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    addProjectConfiguration(tree, "nestjs-app", {
      root: "applications/nestjs-app",
      tags: ["framework:nestjs", "language:typescript"],
    });
    addProjectConfiguration(tree, "another-nestjs-app", {
      root: "applications/another-nestjs-app",
      tags: ["framework:nestjs"],
    });
    addProjectConfiguration(tree, "plain-app", {
      root: "applications/plain-app",
      tags: ["language:typescript"],
    });
    addProjectConfiguration(tree, "no-tags-app", {
      root: "applications/no-tags-app",
    });
  });

  it("should return only projects with the given tag", () => {
    const result = getProjectsWithTag({ tree, tag: "framework:nestjs" });
    expect(result).toContain("nestjs-app");
    expect(result).toContain("another-nestjs-app");
    expect(result).not.toContain("plain-app");
    expect(result).not.toContain("no-tags-app");
  });

  it("should return an empty array when no projects have the tag", () => {
    const result = getProjectsWithTag({ tree, tag: "framework:unknown" });
    expect(result).toHaveLength(0);
  });

  it("should match only the exact tag and not partial matches", () => {
    const result = getProjectsWithTag({ tree, tag: "framework" });
    expect(result).toHaveLength(0);
  });

  it("should return an empty array when no projects exist", () => {
    const emptyTree = createTreeWithEmptyWorkspace();
    const result = getProjectsWithTag({
      tree: emptyTree,
      tag: "framework:nestjs",
    });
    expect(result).toHaveLength(0);
  });
});

describe("resolveProjectByTag", () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    addProjectConfiguration(tree, "nestjs-app", {
      root: "applications/nestjs-app",
      tags: ["framework:nestjs"],
    });
    addProjectConfiguration(tree, "another-nestjs-app", {
      root: "applications/another-nestjs-app",
      tags: ["framework:nestjs"],
    });
  });

  it("should return the project name when it matches the tag", async () => {
    const result = await resolveProject({
      tree,
      tag: "framework:nestjs",
      project: "nestjs-app",
      message: "Select a project",
    });
    expect(result).toBe("nestjs-app");
  });

  it("should throw when no projects with the tag exist", async () => {
    const emptyTree = createTreeWithEmptyWorkspace();
    await expect(
      resolveProject({
        tree: emptyTree,
        tag: "framework:nestjs",
        message: "Select a project",
      }),
    ).rejects.toThrow(
      'No projects with tag "framework:nestjs" found in the workspace',
    );
  });

  it("should throw when the specified project does not have the tag", async () => {
    addProjectConfiguration(tree, "plain-app", {
      root: "applications/plain-app",
      tags: ["language:typescript"],
    });

    await expect(
      resolveProject({
        tree,
        tag: "framework:nestjs",
        project: "plain-app",
        message: "Select a project",
      }),
    ).rejects.toThrow(
      `Project "plain-app" does not have the "framework:nestjs" tag. Available projects: nestjs-app, another-nestjs-app`,
    );
  });

  it("should throw when the specified project does not exist", async () => {
    await expect(
      resolveProject({
        tree,
        tag: "framework:nestjs",
        project: "nonexistent-app",
        message: "Select a project",
      }),
    ).rejects.toThrow(
      `Project "nonexistent-app" does not have the "framework:nestjs" tag.`,
    );
  });
});

describe("resolveNameByCase", () => {
  describe(StringCase.CAMEL_CASE, () => {
    it("should return the name when it is already camelCase", async () => {
      const result = await resolveName({
        name: "myService",
        case: StringCase.CAMEL_CASE,
        message: "Enter a name",
      });
      expect(result).toBe("myService");
    });

    it("should return single lowercase word unchanged", async () => {
      const result = await resolveName({
        name: "calculator",
        case: StringCase.CAMEL_CASE,
        message: "Enter a name",
      });
      expect(result).toBe("calculator");
    });

    it("should throw when name is PascalCase", async () => {
      await expect(
        resolveName({
          name: "MyService",
          case: StringCase.CAMEL_CASE,
          message: "Enter a name",
        }),
      ).rejects.toThrow(
        `Name "MyService" must be in camelCase. Did you mean "myService"?`,
      );
    });

    it("should throw when name is kebab-case", async () => {
      await expect(
        resolveName({
          name: "my-service",
          case: StringCase.CAMEL_CASE,
          message: "Enter a name",
        }),
      ).rejects.toThrow(
        `Name "my-service" must be in camelCase. Did you mean "myService"?`,
      );
    });

    it("should throw when name is snake_case", async () => {
      await expect(
        resolveName({
          name: "my_service",
          case: StringCase.CAMEL_CASE,
          message: "Enter a name",
        }),
      ).rejects.toThrow(
        `Name "my_service" must be in camelCase. Did you mean "myService"?`,
      );
    });
  });

  describe("generateMustacheFiles", () => {
    let templateDirectoryPath: string;

    beforeEach(() => {
      templateDirectoryPath = fs.mkdtempSync(
        path.join(os.tmpdir(), "mustache-templates-"),
      );
    });

    afterEach(() => {
      fs.rmSync(templateDirectoryPath, { recursive: true });
    });

    it("renders template file content with Mustache substitutions", () => {
      fs.writeFileSync(
        path.join(templateDirectoryPath, "__namePascalCase__.tsx"),
        "export const {{namePascalCase}} = (): null => null;\n",
      );
      const tree = createTreeWithEmptyWorkspace();
      const targetDirectoryPath = "applications/my-app/src/components";

      generateFiles({
        tree,
        templateDirectoryPath,
        instanceDirectoryPath: targetDirectoryPath,
        substitutions: { namePascalCase: "Button" },
      });

      expect(tree.read(`${targetDirectoryPath}/Button.tsx`, "utf8")).toBe(
        "export const Button = (): null => null;\n",
      );
    });

    it("resolves __fieldName__ placeholders in filenames", () => {
      fs.writeFileSync(
        path.join(templateDirectoryPath, "__nameKebabCase__.module.ts"),
        "export class {{namePascalCase}}Module {}\n",
      );
      const tree = createTreeWithEmptyWorkspace();
      const targetDirectoryPath = "applications/my-app/src/modules";

      generateFiles({
        tree,
        templateDirectoryPath,
        instanceDirectoryPath: targetDirectoryPath,
        substitutions: {
          nameCamelCase: "userAuth",
          namePascalCase: "UserAuth",
          nameKebabCase: "user-auth",
        },
      });

      expect(tree.exists(`${targetDirectoryPath}/user-auth.module.ts`)).toBe(
        true,
      );
    });
  });

  describe(StringCase.PASCAL_CASE, () => {
    it("should return the name when it is already PascalCase", async () => {
      const result = await resolveName({
        name: "MyService",
        case: StringCase.PASCAL_CASE,
        message: "Enter a name",
      });
      expect(result).toBe("MyService");
    });

    it("should throw when name is camelCase", async () => {
      await expect(
        resolveName({
          name: "myService",
          case: StringCase.PASCAL_CASE,
          message: "Enter a name",
        }),
      ).rejects.toThrow(
        `Name "myService" must be in PascalCase. Did you mean "MyService"?`,
      );
    });

    it("should throw when name is kebab-case", async () => {
      await expect(
        resolveName({
          name: "my-service",
          case: StringCase.PASCAL_CASE,
          message: "Enter a name",
        }),
      ).rejects.toThrow(
        `Name "my-service" must be in PascalCase. Did you mean "MyService"?`,
      );
    });
  });

  describe(StringCase.SNAKE_CASE, () => {
    it("should return the name when it is already snake_case", async () => {
      const result = await resolveName({
        name: "my_service",
        case: StringCase.SNAKE_CASE,
        message: "Enter a name",
      });
      expect(result).toBe("my_service");
    });

    it("should return single lowercase word unchanged", async () => {
      const result = await resolveName({
        name: "calculator",
        case: StringCase.SNAKE_CASE,
        message: "Enter a name",
      });
      expect(result).toBe("calculator");
    });

    it("should throw when name is camelCase", async () => {
      await expect(
        resolveName({
          name: "myService",
          case: StringCase.SNAKE_CASE,
          message: "Enter a name",
        }),
      ).rejects.toThrow(
        `Name "myService" must be in snake_case. Did you mean "my_service"?`,
      );
    });

    it("should throw when name is kebab-case", async () => {
      await expect(
        resolveName({
          name: "my-service",
          case: StringCase.SNAKE_CASE,
          message: "Enter a name",
        }),
      ).rejects.toThrow(
        `Name "my-service" must be in snake_case. Did you mean "my_service"?`,
      );
    });
  });

  describe(StringCase.KEBAB_CASE, () => {
    it("should return the name when it is already kebab-case", async () => {
      const result = await resolveName({
        name: "my-service",
        case: StringCase.KEBAB_CASE,
        message: "Enter a name",
      });
      expect(result).toBe("my-service");
    });

    it("should return single lowercase word unchanged", async () => {
      const result = await resolveName({
        name: "calculator",
        case: StringCase.KEBAB_CASE,
        message: "Enter a name",
      });
      expect(result).toBe("calculator");
    });

    it("should throw when name is camelCase", async () => {
      await expect(
        resolveName({
          name: "myService",
          case: StringCase.KEBAB_CASE,
          message: "Enter a name",
        }),
      ).rejects.toThrow(
        `Name "myService" must be in kebab-case. Did you mean "my-service"?`,
      );
    });

    it("should throw when name is PascalCase", async () => {
      await expect(
        resolveName({
          name: "MyService",
          case: StringCase.KEBAB_CASE,
          message: "Enter a name",
        }),
      ).rejects.toThrow(
        `Name "MyService" must be in kebab-case. Did you mean "my-service"?`,
      );
    });

    it("should throw when name is snake_case", async () => {
      await expect(
        resolveName({
          name: "my_service",
          case: StringCase.KEBAB_CASE,
          message: "Enter a name",
        }),
      ).rejects.toThrow(
        `Name "my_service" must be in kebab-case. Did you mean "my-service"?`,
      );
    });
  });
});
