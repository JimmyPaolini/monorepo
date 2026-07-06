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

import { NestjsGraphqlModuleCommand } from "./nestjs-graphql-module.command";

import type { Tree } from "@nx/devkit";

describe(NestjsGraphqlModuleCommand, () => {
  const projectName = "my-app";
  const projectRoot = "applications/my-app";
  const modulesDirectory = `${projectRoot}/src/modules`;
  const repositoryRootPath = path.resolve(__dirname, "../../../../..");

  let command: NestjsGraphqlModuleCommand;
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
        NestjsGraphqlModuleCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    command = await module.resolve(NestjsGraphqlModuleCommand);
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
        NestjsGraphqlModuleCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    const logger = await module.resolve(LoggerService);

    expect(logger.setContext).toHaveBeenCalledWith(
      "NestjsGraphqlModuleCommand",
    );
  });

  it("returns parsed option values", () => {
    expect(command.parseNameOption("alpha-module")).toBe("alpha-module");
    expect(command.parseProjectOption("alpha-project")).toBe("alpha-project");
  });

  it("generates graphql module scaffold files", async () => {
    await runWithRepositoryRoot(async () => {
      await NestjsGraphqlModuleCommand.generateNestjsGraphqlModule({
        options: {
          name: "user-profile",
          project: projectName,
        },
        tree,
      });
    });

    const modulePath = `${modulesDirectory}/user-profile`;

    expect(tree.exists(`${modulePath}/user-profile.constants.ts`)).toBe(true);
    expect(tree.exists(`${modulePath}/user-profile.entities.ts`)).toBe(true);
    expect(tree.exists(`${modulePath}/user-profile.factories.ts`)).toBe(true);
    expect(tree.exists(`${modulePath}/user-profile.module.ts`)).toBe(true);
    expect(tree.exists(`${modulePath}/user-profile.resolver.ts`)).toBe(true);
    expect(
      tree.exists(`${modulePath}/user-profile.resolver.unit.test.ts`),
    ).toBe(true);
    expect(tree.exists(`${modulePath}/user-profile.types.ts`)).toBe(true);
  });

  it("supports tree-first invocation", async () => {
    await runWithRepositoryRoot(async () => {
      await NestjsGraphqlModuleCommand.generateNestjsGraphqlModule({
        options: {
          name: "audit-log",
          project: projectName,
        },
        tree,
      });
    });

    const modulePath = `${modulesDirectory}/audit-log`;

    expect(tree.exists(`${modulePath}/audit-log.constants.ts`)).toBe(true);
    expect(tree.exists(`${modulePath}/audit-log.entities.ts`)).toBe(true);
    expect(tree.exists(`${modulePath}/audit-log.factories.ts`)).toBe(true);
    expect(tree.exists(`${modulePath}/audit-log.module.ts`)).toBe(true);
    expect(tree.exists(`${modulePath}/audit-log.resolver.ts`)).toBe(true);
    expect(tree.exists(`${modulePath}/audit-log.resolver.unit.test.ts`)).toBe(
      true,
    );
    expect(tree.exists(`${modulePath}/audit-log.types.ts`)).toBe(true);
  });

  it("supports tree-first overload signature", async () => {
    await runWithRepositoryRoot(async () => {
      await NestjsGraphqlModuleCommand.generateNestjsGraphqlModule(tree, {
        name: "event-log",
        project: projectName,
      });
    });

    const modulePath = `${modulesDirectory}/event-log`;

    expect(tree.exists(`${modulePath}/event-log.module.ts`)).toBe(true);
    expect(tree.exists(`${modulePath}/event-log.resolver.ts`)).toBe(true);
  });

  it("writes expected substitutions into generated files", async () => {
    await runWithRepositoryRoot(async () => {
      await NestjsGraphqlModuleCommand.generateNestjsGraphqlModule({
        options: {
          name: "user-profile",
          project: projectName,
        },
        tree,
      });
    });

    const modulePath = `${modulesDirectory}/user-profile`;
    const resolverFile = tree.read(
      `${modulePath}/user-profile.resolver.ts`,
      "utf8",
    );
    const moduleFile = tree.read(
      `${modulePath}/user-profile.module.ts`,
      "utf8",
    );

    expect(resolverFile).toContain("class UserProfileResolver");
    expect(resolverFile).toContain(
      "private readonly userProfileService: UserProfileService",
    );
    expect(resolverFile).toContain("./user-profile.entities");
    expect(resolverFile).toContain("./user-profile.service");

    expect(moduleFile).toContain("export class UserProfileModule");
    expect(moduleFile).toContain("TODO: Document the userProfile module.");
  });

  it("validates module names as kebab-case", async () => {
    await expect(
      NestjsGraphqlModuleCommand.generateNestjsGraphqlModule({
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

  it("rejects projects without required framework:nestjs tag", async () => {
    addProjectConfiguration(tree, "wrong-tag-project", {
      root: "applications/wrong-tag-project",
      tags: ["framework:nest-commander"],
    });
    tree.write("applications/wrong-tag-project/src/modules/.gitkeep", "");

    await expect(
      NestjsGraphqlModuleCommand.generateNestjsGraphqlModule({
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

  it("rejects when no framework:nestjs project exists", async () => {
    const treeWithoutNestjsProject = createTreeWithEmptyWorkspace();
    addProjectConfiguration(treeWithoutNestjsProject, "no-match", {
      root: "applications/no-match",
      tags: ["framework:nest-commander"],
    });

    await expect(
      NestjsGraphqlModuleCommand.generateNestjsGraphqlModule({
        options: {
          name: "user-profile",
        },
        tree: treeWithoutNestjsProject,
      }),
    ).rejects.toThrow(
      'No projects with tag "framework:nestjs" found in the workspace',
    );
  });

  it("rejects when project modules directory is missing", async () => {
    const treeWithoutModulesDirectory = createTreeWithEmptyWorkspace();
    addProjectConfiguration(treeWithoutModulesDirectory, projectName, {
      root: projectRoot,
      tags: ["framework:nestjs"],
    });

    await expect(
      NestjsGraphqlModuleCommand.generateNestjsGraphqlModule({
        options: {
          name: "user-profile",
          project: projectName,
        },
        tree: treeWithoutModulesDirectory,
      }),
    ).rejects.toThrow(
      'Directory "applications/my-app/src/modules" does not exist in project "my-app"',
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
      callback = await NestjsGraphqlModuleCommand.generateNestjsGraphqlModule({
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
