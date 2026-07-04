import { execSync } from "node:child_process";
import path from "node:path";

import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import { addProjectConfiguration } from "@nx/devkit";
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("node:child_process", () => ({
  execSync: vi.fn<typeof execSync>(),
}));

import { LoggerService } from "../logger/logger.service";

import {
  generateNestjsServiceModule,
  NestjsServiceModuleCommand,
} from "./nestjs-service-module.command";

import type { Tree } from "@nx/devkit";

describe(NestjsServiceModuleCommand, () => {
  const projectName = "my-app";
  const projectRoot = "applications/my-app";
  const modulesDirectory = `${projectRoot}/src/modules`;
  const repositoryRootPath = path.resolve(__dirname, "../../../../..");

  let command: NestjsServiceModuleCommand;
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

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        NestjsServiceModuleCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    command = await module.resolve(NestjsServiceModuleCommand);
  });

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    addProjectConfiguration(tree, projectName, {
      root: projectRoot,
      tags: ["framework:nestjs"],
    });
    tree.write(`${modulesDirectory}/.gitkeep`, "");
  });

  it("is defined", () => {
    expect(command).toBeDefined();
  });

  it("sets logger context", async () => {
    const module = await Test.createTestingModule({
      providers: [
        NestjsServiceModuleCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    const logger = await module.resolve(LoggerService);

    expect(logger.setContext).toHaveBeenCalledWith(
      "NestjsServiceModuleCommand",
    );
  });

  it("returns parsed option values", () => {
    expect(command.parseNameOption("alpha-module")).toBe("alpha-module");
    expect(command.parseProjectOption("alpha-project")).toBe("alpha-project");
  });

  it("generates service module scaffold files", async () => {
    await runWithRepositoryRoot(async () => {
      await generateNestjsServiceModule({
        options: {
          name: "user-profile",
          project: projectName,
        },
        tree,
      });
    });

    const modulePath = `${modulesDirectory}/user-profile`;

    expect(tree.exists(`${modulePath}/user-profile.service.ts`)).toBe(true);
    expect(tree.exists(`${modulePath}/user-profile.service.unit.test.ts`)).toBe(
      true,
    );
    expect(tree.exists(`${modulePath}/user-profile.constants.ts`)).toBe(true);
    expect(tree.exists(`${modulePath}/user-profile.module.ts`)).toBe(true);
    expect(tree.exists(`${modulePath}/user-profile.types.ts`)).toBe(true);
  });

  it("supports tree-first generator invocation", async () => {
    await runWithRepositoryRoot(async () => {
      await generateNestjsServiceModule({
        options: {
          name: "audit-log",
          project: projectName,
        },
        tree,
      });
    });

    const modulePath = `${modulesDirectory}/audit-log`;

    expect(tree.exists(`${modulePath}/audit-log.service.ts`)).toBe(true);
    expect(tree.exists(`${modulePath}/audit-log.service.unit.test.ts`)).toBe(
      true,
    );
  });

  it("validates module names as kebab-case", async () => {
    await expect(
      generateNestjsServiceModule({
        options: {
          name: "userProfile",
          project: projectName,
        },
        tree,
      }),
    ).rejects.toThrow(
      'Module name "userProfile" must be in kebab-case. Did you mean "user-profile"?',
    );
  });

  it("rejects project names without required framework:nestjs tag", async () => {
    addProjectConfiguration(tree, "wrong-tag-project", {
      root: "applications/wrong-tag-project",
      tags: ["framework:nest-commander"],
    });
    tree.write("applications/wrong-tag-project/src/modules/.gitkeep", "");

    await expect(
      generateNestjsServiceModule({
        options: {
          name: "user-profile",
          project: "wrong-tag-project",
        },
        tree,
      }),
    ).rejects.toThrow(
      'Project "wrong-tag-project" does not have the "framework:nestjs" tag. Available projects: my-app',
    );
  });

  it("rejects projects missing the modules directory", async () => {
    const treeWithoutModulesDirectory = createTreeWithEmptyWorkspace();
    addProjectConfiguration(treeWithoutModulesDirectory, projectName, {
      root: projectRoot,
      tags: ["framework:nestjs"],
    });

    await expect(
      generateNestjsServiceModule({
        options: {
          name: "user-profile",
          project: projectName,
        },
        tree: treeWithoutModulesDirectory,
      }),
    ).rejects.toThrow(
      `Directory "${modulesDirectory}" does not exist in project "${projectName}"`,
    );
  });

  it("runs command orchestration and logs success", async () => {
    const generatedTree = createTreeWithEmptyWorkspace();
    addProjectConfiguration(generatedTree, projectName, {
      root: projectRoot,
      tags: ["framework:nestjs"],
    });
    generatedTree.write(`${modulesDirectory}/.gitkeep`, "");

    const createWorkspaceTreeSpy = vi
      .spyOn(await import("../../utilities"), "createWorkspaceTree")
      .mockReturnValue(generatedTree);
    const commitWorkspaceTreeSpy = vi
      .spyOn(await import("../../utilities"), "commitWorkspaceTree")
      .mockResolvedValue(undefined);

    await runWithRepositoryRoot(async () => {
      await command.run([], {
        name: "delta-module",
        project: projectName,
      });
    });

    expect(createWorkspaceTreeSpy).toHaveBeenCalledTimes(1);
    expect(
      generatedTree.exists(
        `${modulesDirectory}/delta-module/delta-module.module.ts`,
      ),
    ).toBe(true);
    expect(commitWorkspaceTreeSpy).toHaveBeenCalledTimes(1);
    expect(commitWorkspaceTreeSpy.mock.calls[0]?.[0]).toStrictEqual(
      expect.objectContaining({
        tree: generatedTree,
      }),
    );

    createWorkspaceTreeSpy.mockRestore();
    commitWorkspaceTreeSpy.mockRestore();
  });

  it("builds callback command using generated files", async () => {
    const mockedExecSync = vi.mocked(execSync);
    mockedExecSync.mockReturnValue(Buffer.from(""));

    let callback: (() => Promise<void> | void) | undefined;
    await runWithRepositoryRoot(async () => {
      callback = await generateNestjsServiceModule({
        options: {
          name: "format-target",
          project: projectName,
        },
        tree,
      });
    });

    if (callback === undefined) {
      throw new Error("Expected callback");
    }

    await Promise.resolve(callback());

    expect(mockedExecSync).toHaveBeenCalledTimes(1);
    expect(mockedExecSync.mock.calls[0]?.[0]).toContain(
      "pnpm exec nx format:write --files=",
    );
    expect(mockedExecSync.mock.calls[0]?.[0]).toContain(
      "applications/my-app/src/modules/format-target/",
    );

    mockedExecSync.mockReset();
  });
});
