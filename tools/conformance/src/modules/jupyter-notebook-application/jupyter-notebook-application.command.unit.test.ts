import path from "node:path";

import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { APPLICATIONS_DIRECTORY } from "../../constants";
import { GeneratorService } from "../generator/generator.service";
import { LoggerService } from "../logger/logger.service";

import { JupyterNotebookApplicationCommand } from "./jupyter-notebook-application.command";

import type { Tree } from "@nx/devkit";

describe(JupyterNotebookApplicationCommand, () => {
  const repositoryRootPath = path.resolve(__dirname, "../../../../..");

  let command: JupyterNotebookApplicationCommand;
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
        JupyterNotebookApplicationCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    command = await module.resolve(JupyterNotebookApplicationCommand);
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
        JupyterNotebookApplicationCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    const logger = await module.resolve(LoggerService);

    expect(logger.setContext).toHaveBeenCalledWith(
      "JupyterNotebookApplicationCommand",
    );
  });

  it("returns parsed option values", () => {
    expect(command.parseDescriptionOption("Custom description")).toBe(
      "Custom description",
    );
    expect(command.parseNameOption("alpha-notebook")).toBe("alpha-notebook");
  });

  it("generates notebook scaffold with explicit description", async () => {
    await runWithRepositoryRoot(async () => {
      await JupyterNotebookApplicationCommand.generateJupyterNotebookApplication(
        {
          options: {
            description: "Custom description",
            name: "alpha-notebook",
          },
          tree,
        },
      );
    });

    const projectRoot = `${APPLICATIONS_DIRECTORY}/alpha-notebook`;

    expect(tree.exists(`${projectRoot}/.gitignore`)).toBe(true);
    expect(tree.exists(`${projectRoot}/README.md`)).toBe(true);
    expect(tree.exists(`${projectRoot}/project.json`)).toBe(true);
    expect(tree.exists(`${projectRoot}/pyproject.toml`)).toBe(true);
    expect(tree.exists(`${projectRoot}/src/__init__.py`)).toBe(true);
    expect(tree.exists(`${projectRoot}/src/alpha-notebook.ipynb`)).toBe(true);
    expect(tree.exists(`${projectRoot}/src/models.py`)).toBe(true);
    expect(tree.exists(`${projectRoot}/testing/__init__.py`)).toBe(true);

    const pyproject = tree.read(`${projectRoot}/pyproject.toml`, "utf8");

    expect(pyproject).toContain('name = "alpha-notebook"');
    expect(pyproject).toContain('description = "Custom description"');
  });

  it("supports tree-first overload with fallback description", async () => {
    await runWithRepositoryRoot(async () => {
      await JupyterNotebookApplicationCommand.generateJupyterNotebookApplication(
        {
          options: {
            name: "beta-notebook",
          },
          tree,
        },
      );
    });

    const projectRoot = `${APPLICATIONS_DIRECTORY}/beta-notebook`;
    const pyproject = tree.read(`${projectRoot}/pyproject.toml`, "utf8");

    expect(pyproject).toContain(
      'description = "A Python + Jupyter notebook application scaffold for beta-notebook"',
    );
    expect(tree.exists(`${projectRoot}/src/beta-notebook.ipynb`)).toBe(true);
  });

  it("supports tree-first overload signature", async () => {
    await runWithRepositoryRoot(async () => {
      await JupyterNotebookApplicationCommand.generateJupyterNotebookApplication(
        tree,
        {
          name: "gamma-notebook",
        },
      );
    });

    const projectRoot = `${APPLICATIONS_DIRECTORY}/gamma-notebook`;

    expect(tree.exists(`${projectRoot}/project.json`)).toBe(true);
    expect(tree.exists(`${projectRoot}/src/gamma-notebook.ipynb`)).toBe(true);
  });

  it("throws when target directory already exists", async () => {
    tree.write(`${APPLICATIONS_DIRECTORY}/existing-notebook/.gitkeep`, "");

    await expect(
      JupyterNotebookApplicationCommand.generateJupyterNotebookApplication({
        options: { name: "existing-notebook" },
        tree,
      }),
    ).rejects.toThrow(
      `Directory "${APPLICATIONS_DIRECTORY}/existing-notebook" already exists. Choose a different application name.`,
    );
  });

  it("rejects non-kebab-case names", async () => {
    await expect(
      JupyterNotebookApplicationCommand.generateJupyterNotebookApplication({
        options: { name: "ExistingNotebook" },
        tree,
      }),
    ).rejects.toThrow(
      'Application name "ExistingNotebook" must be in kebab-case. Did you mean "existing-notebook"?',
    );
  });

  it("runs command orchestration and logs success", async () => {
    const runGeneratorCommandSpy = vi
      .spyOn(GeneratorService, "runGeneratorCommand")
      .mockResolvedValue(undefined);

    await runWithRepositoryRoot(async () => {
      await command.run([], {
        description: "Delta",
        name: "delta-notebook",
      });
    });

    expect(runGeneratorCommandSpy).toHaveBeenCalledTimes(1);
    expect(runGeneratorCommandSpy.mock.calls[0]?.[0]).toStrictEqual(
      expect.objectContaining({
        options: {
          description: "Delta",
          name: "delta-notebook",
        },
      }),
    );

    runGeneratorCommandSpy.mockRestore();
  });
});
