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

import { GeneratorService } from "../generator/generator.service";
import { LoggerService } from "../logger/logger.service";

import { NestjsDataloaderModuleCommand } from "./nestjs-dataloader-module.command";

import type { Tree } from "@nx/devkit";

describe(NestjsDataloaderModuleCommand, () => {
  const projectName = "my-app";
  const projectRoot = "applications/my-app";
  const modulesDirectory = `${projectRoot}/src/modules`;
  const repositoryRootPath = path.resolve(__dirname, "../../../../..");

  let command: NestjsDataloaderModuleCommand;
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
        NestjsDataloaderModuleCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    command = await module.resolve(NestjsDataloaderModuleCommand);
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
        NestjsDataloaderModuleCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    const logger = await module.resolve(LoggerService);

    expect(logger.setContext).toHaveBeenCalledWith(
      "NestjsDataloaderModuleCommand",
    );
  });

  it("returns parsed option values", () => {
    expect(command.parseNameOption("alpha-module")).toBe("alpha-module");
    expect(command.parseProjectOption("alpha-project")).toBe("alpha-project");
  });

  it("generates module files from migrated generator logic", async () => {
    await runWithRepositoryRoot(async () => {
      await NestjsDataloaderModuleCommand.generateNestjsDataloaderModule({
        options: {
          name: "post",
          project: projectName,
        },
        tree,
      });
    });

    const modulePath = `${modulesDirectory}/post`;

    expect(tree.exists(`${modulePath}/post.module.ts`)).toBe(true);
    expect(tree.exists(`${modulePath}/post.dataloader.ts`)).toBe(true);
    expect(tree.exists(`${modulePath}/post.dataloader.unit.test.ts`)).toBe(
      true,
    );
    expect(tree.exists(`${modulePath}/post.types.ts`)).toBe(true);
    expect(tree.exists(`${modulePath}/post.constants.ts`)).toBe(true);
  });

  it("validates module names as kebab-case", async () => {
    await expect(
      NestjsDataloaderModuleCommand.generateNestjsDataloaderModule({
        options: {
          name: "blogPost",
          project: projectName,
        },
        tree,
      }),
    ).rejects.toThrow(
      'Module name "blogPost" must be in kebab-case. Did you mean "blog-post"?',
    );
  });

  it("supports tree-first invocation", async () => {
    await runWithRepositoryRoot(async () => {
      await NestjsDataloaderModuleCommand.generateNestjsDataloaderModule({
        options: {
          name: "audit-log",
          project: projectName,
        },
        tree,
      });
    });

    const modulePath = `${modulesDirectory}/audit-log`;

    expect(tree.exists(`${modulePath}/audit-log.module.ts`)).toBe(true);
    expect(tree.exists(`${modulePath}/audit-log.dataloader.ts`)).toBe(true);
  });

  it("supports tree-first overload signature", async () => {
    await runWithRepositoryRoot(async () => {
      await NestjsDataloaderModuleCommand.generateNestjsDataloaderModule(tree, {
        name: "gamma-log",
        project: projectName,
      });
    });

    const modulePath = `${modulesDirectory}/gamma-log`;

    expect(tree.exists(`${modulePath}/gamma-log.module.ts`)).toBe(true);
    expect(tree.exists(`${modulePath}/gamma-log.dataloader.ts`)).toBe(true);
  });

  it("rejects project names without required framework:nestjs tag", async () => {
    addProjectConfiguration(tree, "wrong-tag-project", {
      root: "applications/wrong-tag-project",
      tags: ["framework:nest-commander"],
    });
    tree.write("applications/wrong-tag-project/src/modules/.gitkeep", "");

    await expect(
      NestjsDataloaderModuleCommand.generateNestjsDataloaderModule({
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
      NestjsDataloaderModuleCommand.generateNestjsDataloaderModule({
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
    const runGeneratorCommandSpy = vi
      .spyOn(GeneratorService, "runGeneratorCommand")
      .mockResolvedValue(undefined);

    await runWithRepositoryRoot(async () => {
      await command.run([], {
        name: "delta-module",
        project: projectName,
      });
    });

    expect(runGeneratorCommandSpy).toHaveBeenCalledTimes(1);
    expect(runGeneratorCommandSpy.mock.calls[0]?.[0]).toStrictEqual(
      expect.objectContaining({
        options: {
          name: "delta-module",
          project: projectName,
        },
      }),
    );

    runGeneratorCommandSpy.mockRestore();
  });

  it("builds callback command using generated files", async () => {
    const mockedExecSync = vi.mocked(execSync);
    mockedExecSync.mockReturnValue(Buffer.from(""));

    let callback: (() => Promise<void> | void) | undefined;
    await runWithRepositoryRoot(async () => {
      callback =
        await NestjsDataloaderModuleCommand.generateNestjsDataloaderModule({
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
