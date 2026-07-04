import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";

import { LoggerService } from "../logger/logger.service";

import { ValidatorCommandService } from "./validator.command.service";
import { ValidatorService } from "./validator.service";

describe(ValidatorCommandService, () => {
  it("is defined", async () => {
    const module = await Test.createTestingModule({
      providers: [
        ValidatorCommandService,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
        {
          provide: ValidatorService,
          useValue: createMock<ValidatorService>(),
        },
      ],
    }).compile();

    const commandService = await module.resolve(ValidatorCommandService);

    expect(commandService).toBeDefined();
  });

  it("sets logger context", async () => {
    const module = await Test.createTestingModule({
      providers: [
        ValidatorCommandService,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
        {
          provide: ValidatorService,
          useValue: createMock<ValidatorService>(),
        },
      ],
    }).compile();

    const logger = await module.resolve(LoggerService);

    expect(logger.setContext).toHaveBeenCalledWith("ValidatorCommandService");
  });

  it("creates a fallback logger when constructor receives an undefined logger", () => {
    const commandService = new ValidatorCommandService(
      undefined as never,
      createMock<ValidatorService>(),
    );

    expect(commandService).toBeDefined();
  });

  it("parses comma-separated projects", async () => {
    const module = await Test.createTestingModule({
      providers: [
        ValidatorCommandService,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
        {
          provide: ValidatorService,
          useValue: createMock<ValidatorService>(),
        },
      ],
    }).compile();

    const commandService = await module.resolve(ValidatorCommandService);

    expect(commandService.parseProjects(undefined)).toBeUndefined();
    expect(commandService.parseProjects("conformance,lexico")).toStrictEqual([
      "conformance",
      "lexico",
    ]);
  });

  it("parses comma-separated rules", async () => {
    const module = await Test.createTestingModule({
      providers: [
        ValidatorCommandService,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
        {
          provide: ValidatorService,
          useValue: createMock<ValidatorService>(),
        },
      ],
    }).compile();

    const commandService = await module.resolve(ValidatorCommandService);

    expect(commandService.parseRules(undefined)).toBeUndefined();
    expect(
      commandService.parseRules(
        "nestjs-command-application,nestjs-command-module",
      ),
    ).toStrictEqual(["nestjs-command-application", "nestjs-command-module"]);
  });

  it("throws on failed validation result", async () => {
    const validatorService = createMock<ValidatorService>();
    validatorService.validate.mockResolvedValue({
      generatedAt: new Date().toISOString(),
      passed: false,
      requestedProjects: ["conformance"],
      results: [],
      selectedRules: [],
      summary: {
        failedProjectCount: 1,
        projectCount: 1,
        violatedRuleCount: 1,
      },
    });

    const module = await Test.createTestingModule({
      providers: [
        ValidatorCommandService,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
        {
          provide: ValidatorService,
          useValue: validatorService,
        },
      ],
    }).compile();

    const commandService = await module.resolve(ValidatorCommandService);

    await expect(commandService.run([], {})).rejects.toThrow(
      "Validation failed",
    );
  });

  it("passes selected projects and rules to validator service", async () => {
    const validatorService = createMock<ValidatorService>();
    validatorService.validate.mockResolvedValue({
      generatedAt: new Date().toISOString(),
      passed: true,
      requestedProjects: ["conformance"],
      results: [],
      selectedRules: ["nestjs-command-application"],
      summary: {
        failedProjectCount: 0,
        projectCount: 1,
        violatedRuleCount: 0,
      },
    });
    const logger = createMock<LoggerService>();

    const module = await Test.createTestingModule({
      providers: [
        ValidatorCommandService,
        {
          provide: LoggerService,
          useValue: logger,
        },
        {
          provide: ValidatorService,
          useValue: validatorService,
        },
      ],
    }).compile();

    const commandService = await module.resolve(ValidatorCommandService);

    await expect(
      commandService.run([], {
        projects: ["conformance"],
        rules: ["nestjs-command-application"],
      }),
    ).resolves.toBeUndefined();

    expect(validatorService.validate).toHaveBeenCalledWith({
      projects: ["conformance"],
      rules: ["nestjs-command-application"],
    });
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining('"passed": true'),
    );
  });

  it("filters empty project and invalid rule entries", async () => {
    const module = await Test.createTestingModule({
      providers: [
        ValidatorCommandService,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
        {
          provide: ValidatorService,
          useValue: createMock<ValidatorService>(),
        },
      ],
    }).compile();

    const commandService = await module.resolve(ValidatorCommandService);

    expect(
      commandService.parseProjects(" conformance , , lexico , "),
    ).toStrictEqual(["conformance", "lexico"]);
    expect(
      commandService.parseRules(
        " nestjs-command-application , invalid-rule , nestjs-service-file ",
      ),
    ).toStrictEqual(["nestjs-command-application", "nestjs-service-file"]);
  });
});
