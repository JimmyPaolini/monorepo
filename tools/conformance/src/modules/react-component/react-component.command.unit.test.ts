import path from "node:path";

import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import { addProjectConfiguration } from "@nx/devkit";
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LoggerService } from "../logger/logger.service";

import {
  generateReactComponent,
  ReactComponentCommand,
} from "./react-component.command";

import type { Tree } from "@nx/devkit";

describe(ReactComponentCommand, () => {
  const projectName = "lexico-components";
  const projectRoot = "packages/lexico-components";
  const componentsDirectory = `${projectRoot}/src/components`;
  const repositoryRootPath = path.resolve(__dirname, "../../../../..");

  let command: ReactComponentCommand;
  let tree: Tree;

  const runWithRepositoryRoot = async (
    callback: () => Promise<void>,
  ): Promise<void> => {
    const originalWorkingDirectory = process.cwd();
    process.chdir(repositoryRootPath);
    try {
      await callback();
    } finally {
      process.chdir(originalWorkingDirectory);
    }
  };

  const addReactProject = (workspaceTree: Tree): void => {
    addProjectConfiguration(workspaceTree, projectName, {
      root: projectRoot,
      tags: ["framework:react"],
    });
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReactComponentCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    command = await module.resolve(ReactComponentCommand);
  });

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    addReactProject(tree);
    tree.write(`${componentsDirectory}/.gitkeep`, "");
  });

  it("is defined", () => {
    expect(command).toBeDefined();
  });

  it("sets logger context", async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReactComponentCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    const logger = await module.resolve(LoggerService);

    expect(logger.setContext).toHaveBeenCalledWith("ReactComponentCommand");
  });

  it("returns parsed option values", () => {
    expect(command.parseNameOption("alert-banner")).toBe("alert-banner");
    expect(command.parseProjectOption("lexico-components")).toBe(
      "lexico-components",
    );
  });

  it("generates component scaffold from arguments invocation", async () => {
    await runWithRepositoryRoot(async () => {
      await generateReactComponent({
        options: {
          name: "user-profile-card",
          project: projectName,
        },
        tree,
      });
    });

    const componentPath = `${componentsDirectory}/UserProfileCard.tsx`;
    const testPath = `${componentsDirectory}/UserProfileCard.test.tsx`;

    expect(tree.exists(componentPath)).toBe(true);
    expect(tree.exists(testPath)).toBe(true);

    const componentFile = tree.read(componentPath, "utf8");
    const testFile = tree.read(testPath, "utf8");

    expect(componentFile).toContain("export interface UserProfileCardProps {");
    expect(componentFile).toContain(
      "export const UserProfileCard = (props: UserProfileCardProps): ReactElement =>",
    );
    expect(componentFile).toContain("UserProfileCard component");

    expect(testFile).toContain(
      "import { UserProfileCard, type UserProfileCardProps } from './UserProfileCard';",
    );
    expect(testFile).toContain("describe('UserProfileCard', () => {");
  });

  it("supports tree-first invocation and formats files", async () => {
    const formatFilesSpy = vi.spyOn(await import("@nx/devkit"), "formatFiles");

    await runWithRepositoryRoot(async () => {
      await generateReactComponent({
        options: {
          name: "alert-banner",
          project: projectName,
        },
        tree,
      });
    });

    expect(tree.exists(`${componentsDirectory}/AlertBanner.tsx`)).toBe(true);
    expect(tree.exists(`${componentsDirectory}/AlertBanner.test.tsx`)).toBe(
      true,
    );
    expect(formatFilesSpy).toHaveBeenCalledTimes(1);
    expect(formatFilesSpy).toHaveBeenCalledWith(tree);

    formatFilesSpy.mockRestore();
  });

  it("validates component names as kebab-case", async () => {
    await expect(
      generateReactComponent({
        options: {
          name: "AlertBanner",
          project: projectName,
        },
        tree,
      }),
    ).rejects.toThrow(
      'Component name "AlertBanner" must be in kebab-case. Did you mean "alert-banner"?',
    );
  });

  it("rejects explicit project without framework:react tag", async () => {
    addProjectConfiguration(tree, "caelundas", {
      root: "applications/caelundas",
      tags: ["language:typescript"],
    });

    await expect(
      generateReactComponent({
        options: {
          name: "alert-banner",
          project: "caelundas",
        },
        tree,
      }),
    ).rejects.toThrow(
      'Project "caelundas" does not have the "framework:react" tag. Available projects: lexico-components',
    );
  });

  it("rejects when no framework:react project exists", async () => {
    const treeWithoutReactProject = createTreeWithEmptyWorkspace();
    addProjectConfiguration(treeWithoutReactProject, "caelundas", {
      root: "applications/caelundas",
      tags: ["language:typescript"],
    });

    await expect(
      generateReactComponent({
        options: {
          name: "alert-banner",
          project: "caelundas",
        },
        tree: treeWithoutReactProject,
      }),
    ).rejects.toThrow(
      'No projects with tag "framework:react" found in the workspace',
    );
  });

  it("rejects projects when resolved components directory is missing", async () => {
    const treeWithoutProjectRoot = createTreeWithEmptyWorkspace();
    addProjectConfiguration(treeWithoutProjectRoot, projectName, {
      root: "",
      tags: ["framework:react"],
    });

    await expect(
      generateReactComponent({
        options: {
          name: "alert-banner",
          project: projectName,
        },
        tree: treeWithoutProjectRoot,
      }),
    ).rejects.toThrow(
      'Directory "src/components" does not exist in project "lexico-components"',
    );
  });

  it("rejects when src/components directory is missing", async () => {
    const treeWithoutComponentsDirectory = createTreeWithEmptyWorkspace();
    addReactProject(treeWithoutComponentsDirectory);

    await expect(
      generateReactComponent({
        options: {
          name: "alert-banner",
          project: projectName,
        },
        tree: treeWithoutComponentsDirectory,
      }),
    ).rejects.toThrow(
      'Directory "packages/lexico-components/src/components" does not exist in project "lexico-components"',
    );
  });

  it("runs command orchestration and logs success", async () => {
    const generatedTree = createTreeWithEmptyWorkspace();
    addReactProject(generatedTree);
    generatedTree.write(`${componentsDirectory}/.gitkeep`, "");

    const createWorkspaceTreeSpy = vi
      .spyOn(await import("../../utilities"), "createWorkspaceTree")
      .mockReturnValue(generatedTree);
    const commitWorkspaceTreeSpy = vi
      .spyOn(await import("../../utilities"), "commitWorkspaceTree")
      .mockResolvedValue(undefined);
    const formatFilesSpy = vi.spyOn(await import("@nx/devkit"), "formatFiles");

    await runWithRepositoryRoot(async () => {
      await command.run([], {
        name: "alert-banner",
        project: projectName,
      });
    });

    expect(createWorkspaceTreeSpy).toHaveBeenCalledTimes(1);
    expect(generatedTree.exists(`${componentsDirectory}/AlertBanner.tsx`)).toBe(
      true,
    );
    expect(
      generatedTree.exists(`${componentsDirectory}/AlertBanner.test.tsx`),
    ).toBe(true);
    expect(formatFilesSpy).toHaveBeenCalledWith(generatedTree);
    expect(commitWorkspaceTreeSpy).toHaveBeenCalledWith({
      tree: generatedTree,
    });

    createWorkspaceTreeSpy.mockRestore();
    commitWorkspaceTreeSpy.mockRestore();
    formatFilesSpy.mockRestore();
  });
});
