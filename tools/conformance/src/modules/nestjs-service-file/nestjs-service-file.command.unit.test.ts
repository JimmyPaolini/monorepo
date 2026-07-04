import path from "node:path";

import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import { addProjectConfiguration } from "@nx/devkit";
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import prompts from "prompts";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LoggerService } from "../logger/logger.service";

import {
  generateNestjsServiceFile,
  NestjsServiceFileCommand,
} from "./nestjs-service-file.command";

import type { Tree } from "@nx/devkit";

vi.mock("prompts", () => ({
  default: vi.fn<typeof prompts>(),
}));

describe(NestjsServiceFileCommand, () => {
  const projectName = "my-app";
  const projectRoot = "applications/my-app";
  const modulesDirectory = `${projectRoot}/src/modules`;
  const repositoryRootPath = path.resolve(__dirname, "../../../../..");
  const mockedPrompts = vi.mocked(prompts);

  let command: NestjsServiceFileCommand;
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
        NestjsServiceFileCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    command = await module.resolve(NestjsServiceFileCommand);
  });

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    mockedPrompts.mockReset();
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
        NestjsServiceFileCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    const logger = await module.resolve(LoggerService);

    expect(logger.setContext).toHaveBeenCalledWith("NestjsServiceFileCommand");
  });

  it("returns parsed option values", () => {
    expect(command.parseModuleOption("alpha")).toBe("alpha");
    expect(command.parseNameOption("user-profile")).toBe("user-profile");
    expect(command.parseProjectOption("my-app")).toBe("my-app");
  });

  it("generates service files from migrated generator logic", async () => {
    tree.write(
      `${modulesDirectory}/alpha/alpha.module.ts`,
      "export class Alpha {}",
    );

    await runWithRepositoryRoot(async () => {
      await generateNestjsServiceFile({
        options: {
          module: "alpha",
          name: "user-profile",
          project: projectName,
        },
        tree,
      });
    });

    const modulePath = `${modulesDirectory}/alpha`;

    expect(tree.exists(`${modulePath}/user-profile.service.ts`)).toBe(true);
    expect(tree.exists(`${modulePath}/user-profile.service.unit.test.ts`)).toBe(
      true,
    );
  });

  it("supports tree-first invocation overload", async () => {
    tree.write(
      `${modulesDirectory}/alpha/alpha.module.ts`,
      "export class Alpha {}",
    );

    await runWithRepositoryRoot(async () => {
      await generateNestjsServiceFile({
        options: {
          module: "alpha",
          name: "audit-log",
          project: projectName,
        },
        tree,
      });
    });

    const modulePath = `${modulesDirectory}/alpha`;

    expect(tree.exists(`${modulePath}/audit-log.service.ts`)).toBe(true);
    expect(tree.exists(`${modulePath}/audit-log.service.unit.test.ts`)).toBe(
      true,
    );
  });

  it("throws when modules directory has no module entries", async () => {
    await expect(
      generateNestjsServiceFile({
        options: {
          module: "alpha",
          name: "user-profile",
          project: projectName,
        },
        tree,
      }),
    ).rejects.toThrow(
      `No modules found in "${modulesDirectory}". Create a module first before generating service files.`,
    );
  });

  it("throws when selected module does not exist", async () => {
    tree.write(
      `${modulesDirectory}/alpha/alpha.module.ts`,
      "export class Alpha {}",
    );

    await expect(
      generateNestjsServiceFile({
        options: {
          module: "missing-module",
          name: "user-profile",
          project: projectName,
        },
        tree,
      }),
    ).rejects.toThrow(
      `Module "missing-module" does not exist in "${modulesDirectory}". Available modules: alpha`,
    );
  });

  it("runs command orchestration and logs success", async () => {
    const generatedTree = createTreeWithEmptyWorkspace();
    addProjectConfiguration(generatedTree, projectName, {
      root: projectRoot,
      tags: ["framework:nestjs"],
    });
    generatedTree.write(`${modulesDirectory}/.gitkeep`, "");
    generatedTree.write(
      `${modulesDirectory}/alpha/alpha.module.ts`,
      "export class Alpha {}",
    );

    const createWorkspaceTreeSpy = vi
      .spyOn(await import("../../utilities"), "createWorkspaceTree")
      .mockReturnValue(generatedTree);
    const commitWorkspaceTreeSpy = vi
      .spyOn(await import("../../utilities"), "commitWorkspaceTree")
      .mockResolvedValue(undefined);

    await runWithRepositoryRoot(async () => {
      await command.run([], {
        module: "alpha",
        name: "delta-service",
        project: projectName,
      });
    });

    expect(createWorkspaceTreeSpy).toHaveBeenCalledTimes(1);
    expect(
      generatedTree.exists(
        `${modulesDirectory}/alpha/delta-service.service.ts`,
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

  it("returns callback that can be invoked for generated files", async () => {
    tree.write(
      `${modulesDirectory}/alpha/alpha.module.ts`,
      "export class Alpha {}",
    );

    let callback: (() => Promise<void> | void) | undefined;
    await runWithRepositoryRoot(async () => {
      callback = await generateNestjsServiceFile({
        options: {
          module: "alpha",
          name: "format-target",
          project: projectName,
        },
        tree,
      });
    });

    expect(callback).toBeTypeOf("function");

    if (callback === undefined) {
      throw new Error("Expected callback");
    }

    await expect(Promise.resolve(callback())).resolves.toBeUndefined();
  });

  it("prompts for module when option is not provided", async () => {
    tree.write(
      `${modulesDirectory}/alpha/alpha.module.ts`,
      "export class Alpha {}",
    );
    tree.write(
      `${modulesDirectory}/beta/beta.module.ts`,
      "export class Beta {}",
    );
    mockedPrompts.mockResolvedValueOnce({
      module: "beta",
    });

    await runWithRepositoryRoot(async () => {
      await generateNestjsServiceFile({
        options: {
          name: "prompted-service",
          project: projectName,
        },
        tree,
      });
    });

    expect(
      tree.exists(`${modulesDirectory}/beta/prompted-service.service.ts`),
    ).toBe(true);
    expect(mockedPrompts).toHaveBeenCalledTimes(1);
  });

  it("throws when no module is selected in prompt", async () => {
    tree.write(
      `${modulesDirectory}/alpha/alpha.module.ts`,
      "export class Alpha {}",
    );
    mockedPrompts.mockResolvedValueOnce({
      module: undefined,
    });

    await expect(
      generateNestjsServiceFile({
        options: {
          name: "no-module-selection",
          project: projectName,
        },
        tree,
      }),
    ).rejects.toThrow("No module selected");
  });

  it("throws when prompted module is not in available modules", async () => {
    tree.write(
      `${modulesDirectory}/alpha/alpha.module.ts`,
      "export class Alpha {}",
    );
    mockedPrompts.mockResolvedValueOnce({
      module: "missing-module",
    });

    await expect(
      generateNestjsServiceFile({
        options: {
          name: "prompt-invalid-module",
          project: projectName,
        },
        tree,
      }),
    ).rejects.toThrow(
      `Module "missing-module" does not exist in "${modulesDirectory}". Available modules: alpha`,
    );
  });
});
