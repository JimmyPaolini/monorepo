import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";

import { LoggerService } from "../logger/logger.service";

import { ValidatorService } from "./validator.service";

import * as validatorExports from "./index";

describe(ValidatorService, () => {
  it("is defined", async () => {
    const module = await Test.createTestingModule({
      providers: [
        ValidatorService,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    const service = await module.resolve(ValidatorService);

    expect(service).toBeDefined();
  });

  it("re-exports validator module symbols", () => {
    expect(validatorExports.ValidatorModule).toBeDefined();
    expect(validatorExports.ValidatorService).toBeDefined();
  });

  it("sets logger context", async () => {
    const module = await Test.createTestingModule({
      providers: [
        ValidatorService,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    const logger = await module.resolve(LoggerService);

    expect(logger.setContext).toHaveBeenCalledWith("ValidatorService");
  });

  it("throws for unknown project names", async () => {
    const module = await Test.createTestingModule({
      providers: [
        ValidatorService,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    const service = await module.resolve(ValidatorService);

    await expect(
      service.validate({
        projects: ["project-that-does-not-exist"],
      }),
    ).rejects.toThrow('Unknown project "project-that-does-not-exist"');
  });
});
