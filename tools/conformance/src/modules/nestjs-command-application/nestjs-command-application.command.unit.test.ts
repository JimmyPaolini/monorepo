import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GeneratorService } from "../generator/generator.service";
import { ResolverService } from "../generator/resolver.service";
import { LoggerService } from "../logger/logger.service";

import { NestjsCommandApplicationCommand } from "./nestjs-command-application.command";

const { flushChangesMock } = vi.hoisted(() => {
  return {
    flushChangesMock: vi.fn<() => void>(),
  };
});

vi.mock("nx/src/generators/tree", async (importOriginal) => {
  const importedModule = await importOriginal();

  const actual =
    typeof importedModule === "object" && importedModule !== null
      ? importedModule
      : {};

  return {
    ...actual,
    flushChanges: flushChangesMock,
  };
});

describe(NestjsCommandApplicationCommand, () => {
  let command: NestjsCommandApplicationCommand;
  let generatorService: ReturnType<typeof createMock<GeneratorService>>;
  let resolverService: ReturnType<typeof createMock<ResolverService>>;
  let loggerService: ReturnType<typeof createMock<LoggerService>>;

  beforeEach(async () => {
    generatorService = createMock<GeneratorService>();
    resolverService = createMock<ResolverService>();
    loggerService = createMock<LoggerService>();

    Object.defineProperty(resolverService, "errorMessages", {
      value: {
        moduleEmpty: "Module is required",
        nameCase: "Name must be in kebab-case",
        nameEmpty: "Name is required",
        projectEmpty: "Project is required",
        typeEmpty: "Type is required",
      },
    });

    generatorService.buildNameSubstitutions.mockReturnValue({
      nameCamelCase: "myCommandApp",
      nameKebabCase: "my-command-app",
      namePascalCase: "MyCommandApp",
      nameSnakeCase: "my_command_app",
    });
    generatorService.buildLogMessage.mockImplementation((arguments_) => {
      return `${arguments_.emoji} ${arguments_.label}: ${JSON.stringify(arguments_.data)}`;
    });
    generatorService.getGeneratedFilePaths.mockReturnValue([
      "applications/unit-test-command-app/project.json",
      "applications/unit-test-command-app/src/main.ts",
    ]);
    resolverService.resolveName.mockImplementation(async (arguments_) => {
      return await Promise.resolve(arguments_.value ?? "prompted-command-app");
    });
    resolverService.resolveType.mockImplementation(async (arguments_) => {
      return await Promise.resolve(arguments_.value ?? "applications");
    });

    const module = await Test.createTestingModule({
      providers: [
        NestjsCommandApplicationCommand,
        {
          provide: GeneratorService,
          useValue: generatorService,
        },
        {
          provide: ResolverService,
          useValue: resolverService,
        },
        {
          provide: LoggerService,
          useValue: loggerService,
        },
      ],
    }).compile();

    command = module.get(NestjsCommandApplicationCommand);
  });

  it("is defined", () => {
    expect(command).toBeDefined();
  });

  it("sets logger context", () => {
    expect(loggerService.setContext).toHaveBeenCalledWith(
      NestjsCommandApplicationCommand.name,
    );
  });

  it("resolves valid option values", async () => {
    resolverService.resolveName.mockResolvedValueOnce("my-command-app");
    resolverService.resolveType.mockResolvedValueOnce("applications");

    await expect(command.resolveName("my-command-app")).resolves.toBe(
      "my-command-app",
    );
    await expect(command.resolveType("applications")).resolves.toBe(
      "applications",
    );
  });

  it("delegates type resolution to generator service", async () => {
    resolverService.resolveType.mockResolvedValueOnce("tools");

    await expect(command.resolveType("tools")).resolves.toBe("tools");

    const firstCallArguments = resolverService.resolveType.mock.calls[0]?.[0];

    expect(firstCallArguments).toBeDefined();

    if (!firstCallArguments) {
      return;
    }

    expect(firstCallArguments).not.toHaveProperty("initialChoice");
    expect(firstCallArguments.message).toBe(
      "What type of NestJS command application should be generated?",
    );
    expect(firstCallArguments.value).toBe("tools");
  });

  it("delegates name resolution to generator service", async () => {
    resolverService.resolveName.mockResolvedValueOnce("my-command-app");

    await expect(command.resolveName("my-command-app")).resolves.toBe(
      "my-command-app",
    );

    expect(resolverService.resolveName).toHaveBeenCalledWith({
      message: "What is the name of the application? (kebab-case)",
      value: "my-command-app",
    });
  });

  it("prompts for name when option is missing", async () => {
    resolverService.resolveName.mockResolvedValueOnce("prompted-command-app");

    await expect(command.resolveName(undefined)).resolves.toBe(
      "prompted-command-app",
    );
  });

  it("rejects invalid type", async () => {
    resolverService.resolveType.mockRejectedValueOnce(
      new Error(
        'Type "invalid-root" is not valid. Allowed values: applications, packages, tools',
      ),
    );

    await expect(command.resolveType("invalid-root")).rejects.toThrow(
      'Type "invalid-root" is not valid. Allowed values: applications, packages, tools',
    );
  });

  it("propagates type resolution errors", async () => {
    resolverService.resolveType.mockRejectedValueOnce(
      new Error("Type is required"),
    );

    await expect(command.resolveType(undefined)).rejects.toThrow(
      "Type is required",
    );
  });

  it("rejects invalid direct name values", async () => {
    resolverService.resolveName.mockRejectedValueOnce(
      new Error("Name must be in kebab-case"),
    );

    await expect(command.resolveName("PromptedCommandApp")).rejects.toThrow(
      "Name must be in kebab-case",
    );
  });

  it("propagates name resolution errors", async () => {
    resolverService.resolveName.mockRejectedValueOnce(
      new Error("Name is required"),
    );

    await expect(command.resolveName(undefined)).rejects.toThrow(
      "Name is required",
    );
  });

  it("runs generator orchestration", async () => {
    await command.run([], {
      name: "unit-test-command-app",
      type: "applications",
    });

    expect(generatorService.generateFiles).toHaveBeenCalledWith(
      expect.objectContaining({
        instanceDirectoryPath: "applications/unit-test-command-app",
        templateDirectoryPath:
          "tools/conformance/src/modules/nestjs-command-application/templates",
      }),
    );
    expect(generatorService.getGeneratedFilePaths).toHaveBeenCalledWith(
      expect.objectContaining({
        instanceDirectoryPath: "applications/unit-test-command-app",
      }),
    );
    expect(loggerService.log).toHaveBeenNthCalledWith(
      1,
      '🖥️ NestJS command application options: {"input":{"name":"unit-test-command-app","type":"applications"},"resolved":{"name":"unit-test-command-app","type":"applications"}}',
    );
    expect(loggerService.log).toHaveBeenNthCalledWith(
      2,
      '🖥️ NestJS command application output files: ["applications/unit-test-command-app/project.json","applications/unit-test-command-app/src/main.ts"]',
    );
  });

  it("throws when target directory already exists", async () => {
    await expect(
      command.run([], {
        name: "affirmations",
        type: "applications",
      }),
    ).rejects.toThrow(
      'Directory "applications/affirmations" already exists. Directory already exists. Choose a different application name.',
    );
  });
});
