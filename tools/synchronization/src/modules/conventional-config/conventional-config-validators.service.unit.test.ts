import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { LoggerService } from "../logger/logger.service";

import { ConventionalConfigIoService } from "./conventional-config-io.service";
import { ConventionalConfigValidatorsService } from "./conventional-config-validators.service";

describe(ConventionalConfigValidatorsService, () => {
  let service: ConventionalConfigValidatorsService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ConventionalConfigValidatorsService,
        {
          provide: ConventionalConfigIoService,
          useValue: createMock<ConventionalConfigIoService>(),
        },
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    service = await module.resolve(ConventionalConfigValidatorsService);
  });

  it("is defined", () => {
    expect(service).toBeDefined();
  });
});
