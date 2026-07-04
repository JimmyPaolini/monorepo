import path from "node:path";

import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { APPLICATIONS_DIRECTORY } from "../../constants";
import { LoggerService } from "../logger/logger.service";

import {
  generateNestjsGraphqlApplication,
  NestjsGraphqlApplicationCommand,
} from "./nestjs-graphql-application.command";

import type { Tree } from "@nx/devkit";

describe(NestjsGraphqlApplicationCommand, () => {
  const repositoryRootPath = path.resolve(__dirname, "../../../../..");

  let command: NestjsGraphqlApplicationCommand;
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
        NestjsGraphqlApplicationCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    command = await module.resolve(NestjsGraphqlApplicationCommand);
  });

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it("is defined", () => {
    expect(command).toBeDefined();
  });

  it("sets logger context", async () => {
    const module = await Test.createTestingModule({
      providers: [
        NestjsGraphqlApplicationCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    const logger = await module.resolve(LoggerService);

    expect(logger.setContext).toHaveBeenCalledWith(
      "NestjsGraphqlApplicationCommand",
    );
  });

  it("returns parsed option values", () => {
    expect(command.parseNameOption("atlas-api")).toBe("atlas-api");
  });

  it("generates graphql application scaffold from arguments", async () => {
    await runWithRepositoryRoot(async () => {
      await generateNestjsGraphqlApplication({
        options: {
          name: "atlas-api",
        },
        tree,
      });
    });

    const projectRoot = `${APPLICATIONS_DIRECTORY}/atlas-api`;

    expect(tree.exists(`${projectRoot}/.env.default`)).toBe(true);
    expect(tree.exists(`${projectRoot}/.gitignore`)).toBe(true);
    expect(tree.exists(`${projectRoot}/AGENTS.md`)).toBe(true);
    expect(tree.exists(`${projectRoot}/README.md`)).toBe(true);
    expect(tree.exists(`${projectRoot}/eslint.config.ts`)).toBe(true);
    expect(tree.exists(`${projectRoot}/package.json`)).toBe(true);
    expect(tree.exists(`${projectRoot}/project.json`)).toBe(true);
    expect(tree.exists(`${projectRoot}/tsconfig.json`)).toBe(true);
    expect(tree.exists(`${projectRoot}/vitest.config.ts`)).toBe(true);
    expect(tree.exists(`${projectRoot}/src/main.ts`)).toBe(true);
    expect(tree.exists(`${projectRoot}/src/main.end-to-end.test.ts`)).toBe(
      true,
    );
    expect(tree.exists(`${projectRoot}/testing/mocks.ts`)).toBe(true);
    expect(tree.exists(`${projectRoot}/testing/setup.ts`)).toBe(true);
  });

  it("supports tree-first overload invocation", async () => {
    await runWithRepositoryRoot(async () => {
      await generateNestjsGraphqlApplication({
        options: {
          name: "audit-api",
        },
        tree,
      });
    });

    const projectRoot = `${APPLICATIONS_DIRECTORY}/audit-api`;

    expect(tree.exists(`${projectRoot}/project.json`)).toBe(true);
    expect(tree.exists(`${projectRoot}/package.json`)).toBe(true);
    expect(tree.exists(`${projectRoot}/src/main.ts`)).toBe(true);
    expect(tree.exists(`${projectRoot}/testing/setup.ts`)).toBe(true);
  });

  it("writes expected substitutions into generated files", async () => {
    await runWithRepositoryRoot(async () => {
      await generateNestjsGraphqlApplication({
        options: {
          name: "user-profile-api",
        },
        tree,
      });
    });

    const projectRoot = `${APPLICATIONS_DIRECTORY}/user-profile-api`;
    const packageJson = tree.read(`${projectRoot}/package.json`, "utf8");
    const readme = tree.read(`${projectRoot}/README.md`, "utf8");
    const mainFile = tree.read(`${projectRoot}/src/main.ts`, "utf8");
    const projectJson = tree.read(`${projectRoot}/project.json`, "utf8");

    expect(packageJson).toContain('"name": "user-profile-api"');
    expect(readme).toContain("# UserProfileApi");
    expect(mainFile).toContain(
      "import { UserProfileApiModule } from './modules/user-profile-api/user-profile-api.module';",
    );
    expect(projectJson).toContain('"framework:nestjs"');
    expect(projectJson).toContain('"generator:nestjs-graphql-application"');
  });

  it("rejects existing application directory", async () => {
    tree.write(`${APPLICATIONS_DIRECTORY}/existing-api/.gitkeep`, "");

    await expect(
      generateNestjsGraphqlApplication({
        options: {
          name: "existing-api",
        },
        tree,
      }),
    ).rejects.toThrow(
      'Directory "applications/existing-api" already exists. Choose a different application name.',
    );
  });

  it("validates application name as kebab-case", async () => {
    await expect(
      generateNestjsGraphqlApplication({
        options: {
          name: "ExistingApi",
        },
        tree,
      }),
    ).rejects.toThrow(
      'Application name "ExistingApi" must be in kebab-case. Did you mean "existing-api"?',
    );
  });

  it("runs command orchestration and logs success", async () => {
    const generatedTree = createTreeWithEmptyWorkspace();
    const createWorkspaceTreeSpy = vi
      .spyOn(await import("../../utilities"), "createWorkspaceTree")
      .mockReturnValue(generatedTree);
    const commitWorkspaceTreeSpy = vi
      .spyOn(await import("../../utilities"), "commitWorkspaceTree")
      .mockResolvedValue(undefined);

    await runWithRepositoryRoot(async () => {
      await command.run([], {
        name: "delta-api",
      });
    });

    expect(createWorkspaceTreeSpy).toHaveBeenCalledTimes(1);
    expect(generatedTree.exists("applications/delta-api/project.json")).toBe(
      true,
    );
    expect(commitWorkspaceTreeSpy).toHaveBeenCalledWith({
      tree: generatedTree,
    });

    createWorkspaceTreeSpy.mockRestore();
    commitWorkspaceTreeSpy.mockRestore();
  });
});
