import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { Test } from "@nestjs/testing";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

const { mockValidateInstanceDirectory, mockValidateInstanceFile } = vi.hoisted(
  () => ({
    mockValidateInstanceDirectory: vi.fn<(input: unknown) => unknown>(),
    mockValidateInstanceFile: vi.fn<(input: unknown) => unknown>(),
  }),
);

vi.mock("./validator-files.service", () => ({
  ValidatorFilesService: class ValidatorFilesService {
    validateInstanceDirectory = mockValidateInstanceDirectory;
    validateInstanceFile = mockValidateInstanceFile;
  },
}));

import { ValidatorFilesService } from "./validator-files.service";
import { ValidatorRulesService } from "./validator-rules.service";
import {
  JUPYTER_NOTEBOOK_APPLICATION_GENERATOR_TAG,
  NESTJS_APPLICATION_TAG,
  NESTJS_COMMAND_APPLICATION_GENERATOR_TAG,
  NESTJS_COMMAND_APPLICATION_TAG,
  NESTJS_GRAPHQL_APPLICATION_GENERATOR_TAG,
} from "./validator.constants";

describe(ValidatorRulesService, () => {
  interface ValidateInstanceFileArgument {
    data: { destinationRoot?: string };
    instanceFilePath: string;
    templateFilePath: string;
  }

  const isValidateInstanceFileArgument = (
    value: unknown,
  ): value is ValidateInstanceFileArgument => {
    if (typeof value !== "object" || value === null) {
      return false;
    }

    if (
      !("data" in value) ||
      !("instanceFilePath" in value) ||
      !("templateFilePath" in value)
    ) {
      return false;
    }

    if (
      typeof value.instanceFilePath !== "string" ||
      typeof value.templateFilePath !== "string"
    ) {
      return false;
    }

    if (typeof value.data !== "object" || value.data === null) {
      return false;
    }

    return (
      !("destinationRoot" in value.data) ||
      typeof value.data.destinationRoot === "string" ||
      value.data.destinationRoot === undefined
    );
  };

  function getFirstValidateInstanceFileCallArgument():
    | undefined
    | ValidateInstanceFileArgument {
    const firstCall = mockValidateInstanceFile.mock.calls[0];
    if (firstCall === undefined) {
      return undefined;
    }

    const firstArgument = firstCall[0];
    if (isValidateInstanceFileArgument(firstArgument)) {
      return firstArgument;
    }

    return undefined;
  }

  let service: ValidatorRulesService;
  const temporaryDirectories: string[] = [];

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [ValidatorRulesService, ValidatorFilesService],
    }).compile();

    service = await module.resolve(ValidatorRulesService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();

    while (temporaryDirectories.length > 0) {
      const temporaryDirectory = temporaryDirectories.pop();
      if (temporaryDirectory !== undefined) {
        fs.rmSync(temporaryDirectory, { force: true, recursive: true });
      }
    }
  });

  it("is defined", () => {
    expect(service).toBeDefined();
  });

  it("returns undefined for rules that do not apply", () => {
    const result = service.runRule({
      ruleName: "nestjs-command-application",
      workspaceProject: {
        rootPath: "/workspace/project",
        tags: [],
      },
    });

    expect(result).toBeUndefined();
  });

  it("returns undefined for jupyter-notebook-application when tag is missing", () => {
    const result = service.runRule({
      ruleName: "jupyter-notebook-application",
      workspaceProject: {
        rootPath: "/workspace/project",
        tags: [],
      },
    });

    expect(result).toBeUndefined();
  });

  it("returns undefined for command-module when command-application tag is missing", () => {
    const result = service.runRule({
      ruleName: "nestjs-command-module",
      workspaceProject: {
        rootPath: "/workspace/project",
        tags: [NESTJS_APPLICATION_TAG],
      },
    });

    expect(result).toBeUndefined();
  });

  it("returns undefined for service-module and graphql-module without nestjs application tag", () => {
    const serviceModuleResult = service.runRule({
      ruleName: "nestjs-service-module",
      workspaceProject: {
        rootPath: "/workspace/project",
        tags: [NESTJS_COMMAND_APPLICATION_TAG],
      },
    });

    const graphqlModuleResult = service.runRule({
      ruleName: "nestjs-graphql-module",
      workspaceProject: {
        rootPath: "/workspace/project",
        tags: [NESTJS_COMMAND_APPLICATION_TAG],
      },
    });

    expect(serviceModuleResult).toBeUndefined();
    expect(graphqlModuleResult).toBeUndefined();
  });

  it("runs the Jupyter notebook application rule for tagged projects", () => {
    const projectRootPath = fs.mkdtempSync(
      path.join(os.tmpdir(), "conformance-validator-rules-jupyter-"),
    );
    temporaryDirectories.push(projectRootPath);

    fs.mkdirSync(path.join(projectRootPath, "src"), { recursive: true });
    fs.writeFileSync(
      path.join(projectRootPath, "pyproject.toml"),
      'description = "Notebook project"\n',
    );

    mockValidateInstanceDirectory.mockReturnValue({
      directoryName: "example",
      results: [],
    });

    const result = service.runRule({
      ruleName: "jupyter-notebook-application",
      workspaceProject: {
        rootPath: projectRootPath,
        tags: [JUPYTER_NOTEBOOK_APPLICATION_GENERATOR_TAG],
      },
    });

    expect(result).toHaveLength(2);
    expect(mockValidateInstanceDirectory).toHaveBeenCalledTimes(2);
    expect(mockValidateInstanceDirectory.mock.calls[0]?.[0]).toMatchObject({
      descriptionOverride: "Notebook project",
      instanceDirectoryPath: projectRootPath,
      nameOverride: path.basename(projectRootPath),
    });
    expect(mockValidateInstanceDirectory.mock.calls[1]?.[0]).toMatchObject({
      instanceDirectoryPath: path.join(projectRootPath, "src"),
      nameOverride: path.basename(projectRootPath),
    });
  });

  it("uses an empty description when pyproject.toml is missing", () => {
    const projectRootPath = fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "conformance-validator-rules-jupyter-no-pyproject-",
      ),
    );
    temporaryDirectories.push(projectRootPath);

    fs.mkdirSync(path.join(projectRootPath, "src"), { recursive: true });

    mockValidateInstanceDirectory.mockReturnValue({
      directoryName: "example",
      results: [],
    });

    const result = service.runRule({
      ruleName: "jupyter-notebook-application",
      workspaceProject: {
        rootPath: projectRootPath,
        tags: [JUPYTER_NOTEBOOK_APPLICATION_GENERATOR_TAG],
      },
    });

    expect(result).toHaveLength(2);
    expect(mockValidateInstanceDirectory.mock.calls[0]?.[0]).toMatchObject({
      descriptionOverride: "",
      instanceDirectoryPath: projectRootPath,
    });
  });

  it("uses an empty description when pyproject.toml has no description field", () => {
    const projectRootPath = fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "conformance-validator-rules-jupyter-missing-description-",
      ),
    );
    temporaryDirectories.push(projectRootPath);

    fs.mkdirSync(path.join(projectRootPath, "src"), { recursive: true });
    fs.writeFileSync(
      path.join(projectRootPath, "pyproject.toml"),
      '[project]\nname = "sample"\n',
    );

    mockValidateInstanceDirectory.mockReturnValue({
      directoryName: "example",
      results: [],
    });

    const result = service.runRule({
      ruleName: "jupyter-notebook-application",
      workspaceProject: {
        rootPath: projectRootPath,
        tags: [JUPYTER_NOTEBOOK_APPLICATION_GENERATOR_TAG],
      },
    });

    expect(result).toHaveLength(2);
    expect(mockValidateInstanceDirectory.mock.calls[0]?.[0]).toMatchObject({
      descriptionOverride: "",
      instanceDirectoryPath: projectRootPath,
    });
  });

  it("returns undefined for untagged graphql-application and service-file rules", () => {
    const graphqlApplicationResult = service.runRule({
      ruleName: "nestjs-graphql-application",
      workspaceProject: {
        rootPath: "/workspace/project",
        tags: [],
      },
    });
    const serviceFileResult = service.runRule({
      ruleName: "nestjs-service-file",
      workspaceProject: {
        rootPath: "/workspace/project",
        tags: [],
      },
    });

    expect(graphqlApplicationResult).toBeUndefined();
    expect(serviceFileResult).toBeUndefined();
  });

  it("runs the command application rule for tagged projects", () => {
    const projectRootPath = fs.mkdtempSync(
      path.join(os.tmpdir(), "conformance-validator-rules-command-app-"),
    );
    temporaryDirectories.push(projectRootPath);

    mockValidateInstanceFile.mockReturnValue({
      errors: [],
      instanceFilePath: "instance-file",
      templateFilePath: "template-file",
    });

    const result = service.runRule({
      ruleName: "nestjs-command-application",
      workspaceProject: {
        rootPath: projectRootPath,
        tags: [NESTJS_COMMAND_APPLICATION_GENERATOR_TAG],
      },
    });

    expect(result).toBeDefined();
    expect(result?.[0]?.results.length).toBeGreaterThan(0);
    expect(mockValidateInstanceFile).toHaveBeenCalledWith();

    const firstCallArgument = getFirstValidateInstanceFileCallArgument();

    expect(firstCallArgument?.data).toBeDefined();
    expect(firstCallArgument?.instanceFilePath).toBeTypeOf("string");
    expect(firstCallArgument?.templateFilePath).toBeTypeOf("string");
  });

  it("falls back destinationRoot to applications when relative path has no segment", async () => {
    const temporaryTemplateDirectory = fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "conformance-validator-rules-destination-root-fallback-",
      ),
    );
    temporaryDirectories.push(temporaryTemplateDirectory);
    fs.writeFileSync(
      path.join(temporaryTemplateDirectory, "__nameKebabCase__.module.ts"),
      "export class Placeholder {}\n",
    );

    const relativeSpy = vi.spyOn(path, "relative").mockReturnValue("");
    const splitSpy = vi
      .spyOn(String.prototype, "split")
      .mockReturnValueOnce([] as string[]);

    mockValidateInstanceFile.mockReturnValue({
      errors: [],
      instanceFilePath: "instance-file",
      templateFilePath: "template-file",
    });

    const validatorConstantsModule = await import("./validator.constants");
    const getValidatorTemplateDirectoryPathSpy = vi
      .spyOn(validatorConstantsModule, "getValidatorTemplateDirectoryPath")
      .mockReturnValue(temporaryTemplateDirectory);

    const projectRootPath = fs.mkdtempSync(
      path.join(
        os.tmpdir(),
        "conformance-validator-rules-destination-root-fallback-project-",
      ),
    );
    temporaryDirectories.push(projectRootPath);

    service.runRule({
      ruleName: "nestjs-command-application",
      workspaceProject: {
        rootPath: projectRootPath,
        tags: [NESTJS_COMMAND_APPLICATION_GENERATOR_TAG],
      },
    });

    getValidatorTemplateDirectoryPathSpy.mockRestore();

    expect(mockValidateInstanceFile).toHaveBeenCalledWith();

    const firstCallArgument = getFirstValidateInstanceFileCallArgument();

    expect(firstCallArgument?.data.destinationRoot).toBe("applications");

    relativeSpy.mockRestore();
    splitSpy.mockRestore();
  });

  it("runs the GraphQL application rule for tagged projects", () => {
    const projectRootPath = "/workspace/applications/example";

    mockValidateInstanceDirectory.mockReturnValue({
      directoryName: "example",
      results: [],
    });

    const result = service.runRule({
      ruleName: "nestjs-graphql-application",
      workspaceProject: {
        rootPath: projectRootPath,
        tags: [NESTJS_GRAPHQL_APPLICATION_GENERATOR_TAG],
      },
    });

    expect(result).toHaveLength(1);
    expect(mockValidateInstanceDirectory).toHaveBeenCalledTimes(1);
    expect(mockValidateInstanceDirectory.mock.calls[0]?.[0]).toMatchObject({
      instanceDirectoryPath: projectRootPath,
    });
  });

  it("filters logger modules and only validates command modules", () => {
    const projectRootPath = fs.mkdtempSync(
      path.join(os.tmpdir(), "conformance-validator-rules-command-"),
    );
    temporaryDirectories.push(projectRootPath);

    const modulesDirectoryPath = path.join(projectRootPath, "src", "modules");
    fs.mkdirSync(path.join(modulesDirectoryPath, "logger"), {
      recursive: true,
    });
    fs.mkdirSync(path.join(modulesDirectoryPath, "alpha"), { recursive: true });
    fs.mkdirSync(path.join(modulesDirectoryPath, "beta"), { recursive: true });
    fs.writeFileSync(
      path.join(modulesDirectoryPath, "alpha", "alpha.command.ts"),
      "export class AlphaCommand {}\n",
    );
    fs.writeFileSync(
      path.join(modulesDirectoryPath, "alpha", "alpha.module.ts"),
      "export class AlphaModule {}\n",
    );
    fs.writeFileSync(
      path.join(modulesDirectoryPath, "beta", "beta.module.ts"),
      "export class BetaModule {}\n",
    );

    mockValidateInstanceDirectory.mockReturnValue({
      directoryName: "alpha",
      results: [],
    });
    mockValidateInstanceFile.mockReturnValue({
      errors: [],
      instanceFilePath: "instance-file",
      templateFilePath: "template-file",
    });

    const result = service.runRule({
      ruleName: "nestjs-command-module",
      workspaceProject: {
        rootPath: projectRootPath,
        tags: [NESTJS_APPLICATION_TAG, NESTJS_COMMAND_APPLICATION_TAG],
      },
    });

    expect(result).toHaveLength(1);
    expect(mockValidateInstanceDirectory).toHaveBeenCalledTimes(1);
    expect(mockValidateInstanceDirectory.mock.calls[0]?.[0]).toMatchObject({
      instanceDirectoryPath: path.join(modulesDirectoryPath, "alpha"),
    });
  });

  it("filters GraphQL and service modules from module directories", () => {
    const projectRootPath = fs.mkdtempSync(
      path.join(os.tmpdir(), "conformance-validator-rules-modules-"),
    );
    temporaryDirectories.push(projectRootPath);

    const modulesDirectoryPath = path.join(projectRootPath, "src", "modules");
    fs.mkdirSync(path.join(modulesDirectoryPath, "logger"), {
      recursive: true,
    });
    fs.mkdirSync(path.join(modulesDirectoryPath, "alpha"), { recursive: true });
    fs.mkdirSync(path.join(modulesDirectoryPath, "beta"), { recursive: true });
    fs.writeFileSync(
      path.join(modulesDirectoryPath, "alpha", "alpha.resolver.ts"),
      "export class AlphaResolver {}\n",
    );
    fs.writeFileSync(
      path.join(modulesDirectoryPath, "alpha", "alpha.module.ts"),
      "export class AlphaModule {}\n",
    );
    fs.writeFileSync(
      path.join(modulesDirectoryPath, "beta", "beta.module.ts"),
      "export class BetaModule {}\n",
    );
    fs.writeFileSync(
      path.join(modulesDirectoryPath, "beta", "beta.service.ts"),
      "export class BetaService {}\n",
    );
    mockValidateInstanceDirectory.mockReturnValue({
      directoryName: "alpha",
      results: [],
    });

    const graphqlResult = service.runRule({
      ruleName: "nestjs-graphql-module",
      workspaceProject: {
        rootPath: projectRootPath,
        tags: [NESTJS_APPLICATION_TAG],
      },
    });

    expect(graphqlResult).toHaveLength(1);
    expect(mockValidateInstanceDirectory).toHaveBeenCalledTimes(1);
    expect(mockValidateInstanceDirectory.mock.calls[0]?.[0]).toMatchObject({
      instanceDirectoryPath: path.join(modulesDirectoryPath, "alpha"),
    });

    mockValidateInstanceDirectory.mockClear();

    const serviceResult = service.runRule({
      ruleName: "nestjs-service-module",
      workspaceProject: {
        rootPath: projectRootPath,
        tags: [NESTJS_APPLICATION_TAG],
      },
    });

    expect(serviceResult).toHaveLength(1);
    expect(mockValidateInstanceDirectory).toHaveBeenCalledTimes(1);
    expect(mockValidateInstanceDirectory.mock.calls[0]?.[0]).toMatchObject({
      instanceDirectoryPath: path.join(modulesDirectoryPath, "beta"),
    });
  });

  it("returns no module directories when the modules root is missing", () => {
    const projectRootPath = fs.mkdtempSync(
      path.join(os.tmpdir(), "conformance-validator-rules-no-modules-"),
    );
    temporaryDirectories.push(projectRootPath);

    const result = service.runRule({
      ruleName: "nestjs-graphql-module",
      workspaceProject: {
        rootPath: projectRootPath,
        tags: [NESTJS_APPLICATION_TAG],
      },
    });

    expect(result).toStrictEqual([]);
    expect(mockValidateInstanceDirectory).not.toHaveBeenCalled();
  });

  it("returns an empty result set when no service files are found", () => {
    const projectRootPath = fs.mkdtempSync(
      path.join(os.tmpdir(), "conformance-validator-rules-service-empty-"),
    );
    temporaryDirectories.push(projectRootPath);

    const result = service.runRule({
      ruleName: "nestjs-service-file",
      workspaceProject: {
        rootPath: projectRootPath,
        tags: [NESTJS_APPLICATION_TAG],
      },
    });

    expect(result).toStrictEqual([]);
    expect(mockValidateInstanceDirectory).not.toHaveBeenCalled();
  });

  it("validates each discovered service file", () => {
    const projectRootPath = fs.mkdtempSync(
      path.join(os.tmpdir(), "conformance-validator-rules-service-"),
    );
    temporaryDirectories.push(projectRootPath);

    fs.mkdirSync(path.join(projectRootPath, "src", "modules", "alpha"), {
      recursive: true,
    });
    fs.mkdirSync(path.join(projectRootPath, "src", "modules", "beta"), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(projectRootPath, "src", "modules", "alpha", "alpha.service.ts"),
      "export class AlphaService {}\n",
    );
    fs.writeFileSync(
      path.join(projectRootPath, "src", "modules", "beta", "beta.service.ts"),
      "export class BetaService {}\n",
    );

    mockValidateInstanceDirectory.mockReturnValue({
      directoryName: "alpha",
      results: [],
    });

    const result = service.runRule({
      ruleName: "nestjs-service-file",
      workspaceProject: {
        rootPath: projectRootPath,
        tags: [NESTJS_APPLICATION_TAG],
      },
    });

    expect(result).toHaveLength(2);
    expect(mockValidateInstanceFile).toHaveBeenCalledTimes(4);
  });

  it("returns undefined for unknown rule names through default branch", () => {
    const result = service.runRule({
      ruleName: "unknown-rule",
      workspaceProject: {
        rootPath: "/workspace/project",
        tags: [NESTJS_APPLICATION_TAG],
      },
    });

    expect(result).toBeUndefined();
  });
});
