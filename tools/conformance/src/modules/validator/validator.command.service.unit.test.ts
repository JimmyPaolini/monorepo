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
});
