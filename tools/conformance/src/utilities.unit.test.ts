import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { addProjectConfiguration } from "@nx/devkit";
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { StringCase } from "./types";
import {
  buildKebabCaseNameSubstitutions,
  commitWorkspaceTree,
  createFormatFilesCallback,
  createWorkspaceTree,
  generateFiles,
  getProjectsWithTag,
  isGeneratorInvocationArguments,
  normalizeGeneratorInvocationFromArguments,
  normalizeGeneratorInvocationFromTree,
  resolveName,
  resolveProject,
  resolveProjectComponentsDirectoryPath,
  resolveProjectDirectoryPath,
  resolveProjectModulesDirectoryPath,
} from "./utilities";

const { execSyncMock, promptsMock } = vi.hoisted(() => {
  return {
    execSyncMock: vi.fn<(...arguments_: unknown[]) => unknown>(),
    promptsMock: vi.fn<(...arguments_: unknown[]) => unknown>(),
  };
});

vi.mock("node:child_process", () => ({
  execSync: execSyncMock,
}));

vi.mock("prompts", () => ({
  default: promptsMock,
}));

describe("utilities", () => {
  beforeEach(() => {
    execSyncMock.mockReset();
    promptsMock.mockReset();
  });

  it("builds kebab-case substitutions", () => {
    const result = buildKebabCaseNameSubstitutions("user-profile");

    expect(result).toStrictEqual({
      nameCamelCase: "userProfile",
      nameKebabCase: "user-profile",
      namePascalCase: "UserProfile",
    });
  });

  it("commits workspace tree without callback", async () => {
    const tree = createTreeWithEmptyWorkspace();

    await expect(
      commitWorkspaceTree({
        tree,
      }),
    ).resolves.toBeUndefined();
  });

  it("commits workspace tree and executes callback", async () => {
    const tree = createTreeWithEmptyWorkspace();
    const callback = vi.fn<() => void>();

    await commitWorkspaceTree({
      callback,
      tree,
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("creates format callback and formats generated files", () => {
    const tree = createTreeWithEmptyWorkspace();
    const targetPath = "applications/my-app/src/modules/user-profile";
    tree.write(`${targetPath}/a.ts`, "a");
    tree.write(`${targetPath}/b.ts`, "b");

    const callback = createFormatFilesCallback({
      targetPath,
      tree,
    });

    void callback();

    expect(execSyncMock).toHaveBeenCalledTimes(1);
    expect(execSyncMock.mock.calls[0]?.[0]).toContain(
      "pnpm exec nx format:write --files=",
    );
    expect(execSyncMock.mock.calls[0]?.[0]).toContain(`${targetPath}/a.ts`);
    expect(execSyncMock.mock.calls[0]?.[0]).toContain(`${targetPath}/b.ts`);
  });

  it("skips formatting when callback has no generated files", () => {
    const tree = createTreeWithEmptyWorkspace();
    const callback = createFormatFilesCallback({
      targetPath: "applications/my-app/src/modules/empty-module",
      tree,
    });

    void callback();

    expect(execSyncMock).not.toHaveBeenCalled();
  });

  it("creates a workspace tree", () => {
    const tree = createWorkspaceTree();

    expect(tree).toBeDefined();
    expect(typeof tree.listChanges).toBe("function");
  });

  it("generates files from templates including nested directories", () => {
    const tree = createTreeWithEmptyWorkspace();
    const temporaryTemplateDirectory = fs.mkdtempSync(
      path.join(os.tmpdir(), "conformance-templates-"),
    );
    fs.mkdirSync(path.join(temporaryTemplateDirectory, "nested"));
    fs.writeFileSync(
      path.join(temporaryTemplateDirectory, "__namePascalCase__.txt"),
      "Hello {{nameCamelCase}}",
    );
    fs.writeFileSync(
      path.join(temporaryTemplateDirectory, "nested", "__nameKebabCase__.md"),
      "# {{namePascalCase}}",
    );

    generateFiles({
      instanceDirectoryPath: "applications/my-app/src/modules/user-profile",
      substitutions: {
        nameCamelCase: "userProfile",
        nameKebabCase: "user-profile",
        namePascalCase: "UserProfile",
      },
      templateDirectoryPath: temporaryTemplateDirectory,
      tree,
    });

    expect(
      tree.read(
        "applications/my-app/src/modules/user-profile/UserProfile.txt",
        "utf8",
      ),
    ).toBe("Hello userProfile");
    expect(
      tree.read(
        "applications/my-app/src/modules/user-profile/nested/user-profile.md",
        "utf8",
      ),
    ).toBe("# UserProfile");
  });

  it("returns projects with a given tag", () => {
    const tree = createTreeWithEmptyWorkspace();
    addProjectConfiguration(tree, "my-app", {
      root: "applications/my-app",
      tags: ["framework:nestjs"],
    });
    addProjectConfiguration(tree, "my-other-app", {
      root: "applications/my-other-app",
      tags: ["framework:react"],
    });

    const result = getProjectsWithTag({
      tag: "framework:nestjs",
      tree,
    });

    expect(result).toStrictEqual(["my-app"]);
  });

  it("detects invocation argument shapes", () => {
    const tree = createTreeWithEmptyWorkspace();

    expect(isGeneratorInvocationArguments(null)).toBe(false);
    expect(isGeneratorInvocationArguments("value")).toBe(false);
    expect(
      isGeneratorInvocationArguments({
        options: {},
        tree,
      }),
    ).toBe(true);
  });

  it("normalizes invocation arguments", () => {
    const tree = createTreeWithEmptyWorkspace();
    const argumentResult = normalizeGeneratorInvocationFromArguments({
      options: {
        name: "alpha",
      },
      tree,
    });
    const treeResult = normalizeGeneratorInvocationFromTree<{
      name?: string;
    }>({
      tree,
    });

    expect(argumentResult.options).toStrictEqual({ name: "alpha" });
    expect(treeResult.options).toStrictEqual({});
    expect(treeResult.tree).toBe(tree);
  });

  it("resolves valid names and rejects invalid names", async () => {
    await expect(
      resolveName({
        case: StringCase.KEBAB_CASE,
        message: "name",
        name: "valid-name",
        subject: "Module name",
      }),
    ).resolves.toBe("valid-name");

    await expect(
      resolveName({
        case: StringCase.KEBAB_CASE,
        message: "name",
        name: "invalidName",
        subject: "Module name",
      }),
    ).rejects.toThrow(
      'Module name "invalidName" must be in kebab-case. Did you mean "invalid-name"?',
    );
  });

  it("prompts for name when not provided", async () => {
    promptsMock.mockResolvedValueOnce({
      name: "user-profile",
    });

    await expect(
      resolveName({
        case: StringCase.KEBAB_CASE,
        message: "name",
      }),
    ).resolves.toBe("user-profile");
  });

  it("throws when prompted name is missing", async () => {
    promptsMock.mockResolvedValueOnce({
      name: undefined,
    });

    await expect(
      resolveName({
        case: StringCase.KEBAB_CASE,
        message: "name",
      }),
    ).rejects.toThrow("No name provided");
  });

  it("resolves project by tag and validates availability", async () => {
    const tree = createTreeWithEmptyWorkspace();
    addProjectConfiguration(tree, "my-app", {
      root: "applications/my-app",
      tags: ["framework:nestjs"],
    });

    await expect(
      resolveProject({
        message: "project",
        project: "my-app",
        tag: "framework:nestjs",
        tree,
      }),
    ).resolves.toBe("my-app");

    await expect(
      resolveProject({
        message: "project",
        project: "missing-app",
        tag: "framework:nestjs",
        tree,
      }),
    ).rejects.toThrow(
      'Project "missing-app" does not have the "framework:nestjs" tag. Available projects: my-app',
    );
  });

  it("prompts for project when not provided", async () => {
    const tree = createTreeWithEmptyWorkspace();
    addProjectConfiguration(tree, "my-app", {
      root: "applications/my-app",
      tags: ["framework:nestjs"],
    });

    promptsMock.mockResolvedValueOnce({
      project: "my-app",
    });

    await expect(
      resolveProject({
        message: "project",
        tag: "framework:nestjs",
        tree,
      }),
    ).resolves.toBe("my-app");
  });

  it("throws when prompted project is missing or no project exists for tag", async () => {
    const tree = createTreeWithEmptyWorkspace();
    addProjectConfiguration(tree, "my-app", {
      root: "applications/my-app",
      tags: ["framework:nestjs"],
    });

    promptsMock.mockResolvedValueOnce({
      project: undefined,
    });

    await expect(
      resolveProject({
        message: "project",
        tag: "framework:nestjs",
        tree,
      }),
    ).rejects.toThrow("No project selected");

    const emptyTree = createTreeWithEmptyWorkspace();

    await expect(
      resolveProject({
        message: "project",
        tag: "framework:nestjs",
        tree: emptyTree,
      }),
    ).rejects.toThrow(
      'No projects with tag "framework:nestjs" found in the workspace',
    );
  });

  it("resolves project directories and validates missing cases", () => {
    const tree = createTreeWithEmptyWorkspace();
    addProjectConfiguration(tree, "my-app", {
      root: "applications/my-app",
      tags: ["framework:nestjs"],
    });
    tree.write("applications/my-app/src/components/.gitkeep", "");
    tree.write("applications/my-app/src/modules/.gitkeep", "");

    expect(
      resolveProjectDirectoryPath({
        directoryPath: "src/modules",
        projectName: "my-app",
        tree,
      }),
    ).toBe("applications/my-app/src/modules");
    expect(
      resolveProjectComponentsDirectoryPath({
        projectName: "my-app",
        tree,
      }),
    ).toBe("applications/my-app/src/components");
    expect(
      resolveProjectModulesDirectoryPath({
        projectName: "my-app",
        tree,
      }),
    ).toBe("applications/my-app/src/modules");

    const treeWithoutRoot = createTreeWithEmptyWorkspace();
    addProjectConfiguration(treeWithoutRoot, "my-app", {
      root: "",
      tags: ["framework:nestjs"],
    });

    expect(() =>
      resolveProjectDirectoryPath({
        directoryPath: "src/modules",
        projectName: "my-app",
        tree: treeWithoutRoot,
      }),
    ).toThrow('Directory "src/modules" does not exist in project "my-app"');

    const treeWithoutDirectory = createTreeWithEmptyWorkspace();
    addProjectConfiguration(treeWithoutDirectory, "my-app", {
      root: "applications/my-app",
      tags: ["framework:nestjs"],
    });

    expect(() =>
      resolveProjectDirectoryPath({
        directoryPath: "src/modules",
        projectName: "my-app",
        tree: treeWithoutDirectory,
      }),
    ).toThrow(
      'Directory "applications/my-app/src/modules" does not exist in project "my-app"',
    );
  });

  it("throws when project configuration is missing", () => {
    const tree = createTreeWithEmptyWorkspace();

    expect(() =>
      resolveProjectDirectoryPath({
        directoryPath: "src/modules",
        projectName: "missing-project",
        tree,
      }),
    ).toThrow('Project "missing-project" has no root directory configured');
  });
});
