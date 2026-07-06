import path from "node:path";

import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import prompts from "prompts";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  APPLICATIONS_DIRECTORY,
  DESTINATION_ROOTS,
  TOOLS_DIRECTORY,
} from "../../constants";
import { LoggerService } from "../logger/logger.service";

import { NestjsCommandApplicationCommand } from "./nestjs-command-application.command";

import type { Tree } from "@nx/devkit";

vi.mock("prompts", () => ({
  default: vi.fn<typeof prompts>(),
}));

describe(NestjsCommandApplicationCommand, () => {
  const repositoryRootPath = path.resolve(__dirname, "../../../../..");
  const mockedPrompts = vi.mocked(prompts);

  let command: NestjsCommandApplicationCommand;
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
        NestjsCommandApplicationCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    command = await module.resolve(NestjsCommandApplicationCommand);
  });

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
    mockedPrompts.mockReset();
  });

  it("is defined", () => {
    expect(command).toBeDefined();
  });

  it("sets logger context", async () => {
    const module = await Test.createTestingModule({
      providers: [
        NestjsCommandApplicationCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    const logger = await module.resolve(LoggerService);

    expect(logger.setContext).toHaveBeenCalledWith(
      "NestjsCommandApplicationCommand",
    );
  });

  it("returns parsed option values", () => {
    expect(command.parseDestinationRootOption("applications")).toBe(
      "applications",
    );
    expect(command.parseNameOption("alpha-app")).toBe("alpha-app");
  });

  it("generates a command application under applications", async () => {
    await runWithRepositoryRoot(async () => {
      await NestjsCommandApplicationCommand.generateNestjsCommandApplication({
        options: {
          destinationRoot: APPLICATIONS_DIRECTORY,
          name: "my-command-app",
        },
        tree,
      });
    });

    const projectRoot = `${APPLICATIONS_DIRECTORY}/my-command-app`;

    expect(tree.exists(`${projectRoot}/project.json`)).toBe(true);
    expect(tree.exists(`${projectRoot}/package.json`)).toBe(true);
    expect(tree.exists(`${projectRoot}/src/main.ts`)).toBe(true);
    expect(tree.exists(`${projectRoot}/src/main.module.ts`)).toBe(true);
  });

  it("generates a command application under tools", async () => {
    await runWithRepositoryRoot(async () => {
      await NestjsCommandApplicationCommand.generateNestjsCommandApplication({
        options: {
          destinationRoot: TOOLS_DIRECTORY,
          name: "my-command-tool",
        },
        tree,
      });
    });

    const projectRoot = `${TOOLS_DIRECTORY}/my-command-tool`;

    expect(tree.exists(`${projectRoot}/project.json`)).toBe(true);
    expect(tree.exists(`${projectRoot}/package.json`)).toBe(true);
    expect(tree.exists(`${projectRoot}/src/main.ts`)).toBe(true);
  });

  it("supports tree-first invocation overload", async () => {
    await runWithRepositoryRoot(async () => {
      await NestjsCommandApplicationCommand.generateNestjsCommandApplication({
        options: {
          destinationRoot: APPLICATIONS_DIRECTORY,
          name: "tree-first-command-app",
        },
        tree,
      });
    });

    const projectRoot = `${APPLICATIONS_DIRECTORY}/tree-first-command-app`;

    expect(tree.exists(`${projectRoot}/project.json`)).toBe(true);
    expect(tree.exists(`${projectRoot}/src/main.ts`)).toBe(true);
  });

  it("supports tree-first overload signature", async () => {
    await runWithRepositoryRoot(async () => {
      await NestjsCommandApplicationCommand.generateNestjsCommandApplication(
        tree,
        {
          destinationRoot: APPLICATIONS_DIRECTORY,
          name: "signature-command-app",
        },
      );
    });

    const projectRoot = `${APPLICATIONS_DIRECTORY}/signature-command-app`;

    expect(tree.exists(`${projectRoot}/project.json`)).toBe(true);
    expect(tree.exists(`${projectRoot}/src/main.ts`)).toBe(true);
  });

  it("prompts for destination root when not provided", async () => {
    mockedPrompts.mockResolvedValueOnce({
      destinationRoot: TOOLS_DIRECTORY,
    });

    await runWithRepositoryRoot(async () => {
      await NestjsCommandApplicationCommand.generateNestjsCommandApplication({
        options: {
          name: "prompted-command-app",
        },
        tree,
      });
    });

    const projectRoot = `${TOOLS_DIRECTORY}/prompted-command-app`;

    expect(tree.exists(`${projectRoot}/project.json`)).toBe(true);
    expect(mockedPrompts).toHaveBeenCalledTimes(1);
  });

  it("throws when no destination root is selected in prompt", async () => {
    mockedPrompts.mockResolvedValueOnce({
      destinationRoot: undefined,
    });

    await expect(
      NestjsCommandApplicationCommand.generateNestjsCommandApplication({
        options: {
          name: "missing-destination-selection",
        },
        tree,
      }),
    ).rejects.toThrow("No destination root selected");
  });

  it("throws when prompted destination root is invalid", async () => {
    mockedPrompts.mockResolvedValueOnce({
      destinationRoot: "invalid-root",
    });

    await expect(
      NestjsCommandApplicationCommand.generateNestjsCommandApplication({
        options: {
          name: "invalid-prompted-destination",
        },
        tree,
      }),
    ).rejects.toThrow(
      `Destination root "invalid-root" is not valid. Allowed values: ${DESTINATION_ROOTS.join(", ")}`,
    );
  });

  it("throws when target directory already exists", async () => {
    tree.write(`${APPLICATIONS_DIRECTORY}/existing-app/.gitkeep`, "");

    await expect(
      NestjsCommandApplicationCommand.generateNestjsCommandApplication({
        options: {
          destinationRoot: APPLICATIONS_DIRECTORY,
          name: "existing-app",
        },
        tree,
      }),
    ).rejects.toThrow(
      `Directory "${APPLICATIONS_DIRECTORY}/existing-app" already exists. Choose a different application name.`,
    );
  });

  it("throws for invalid destination roots", async () => {
    await expect(
      NestjsCommandApplicationCommand.generateNestjsCommandApplication({
        options: {
          destinationRoot: "invalid-root",
          name: "my-command-app",
        },
        tree,
      }),
    ).rejects.toThrow(
      `Destination root "invalid-root" is not valid. Allowed values: ${DESTINATION_ROOTS.join(", ")}`,
    );
  });

  it("validates application names as kebab-case", async () => {
    await expect(
      NestjsCommandApplicationCommand.generateNestjsCommandApplication({
        options: {
          destinationRoot: APPLICATIONS_DIRECTORY,
          name: "myCommandApp",
        },
        tree,
      }),
    ).rejects.toThrow(
      'Application name "myCommandApp" must be in kebab-case. Did you mean "my-command-app"?',
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
        destinationRoot: APPLICATIONS_DIRECTORY,
        name: "my-command-app",
      });
    });

    expect(createWorkspaceTreeSpy).toHaveBeenCalledTimes(1);
    expect(
      generatedTree.exists("applications/my-command-app/project.json"),
    ).toBe(true);
    expect(commitWorkspaceTreeSpy).toHaveBeenCalledWith({
      tree: generatedTree,
    });

    createWorkspaceTreeSpy.mockRestore();
    commitWorkspaceTreeSpy.mockRestore();
  });
});
