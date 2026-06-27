import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { LoggerService } from "../logger/logger.service";

import { ConventionalConfigConstantsService } from "./conventional-config-constants.service";
import { ConventionalConfigHelpersService } from "./conventional-config-helpers.service";
import { ConventionalConfigIoService } from "./conventional-config-io.service";
import { ConventionalConfigValidatorsService } from "./conventional-config-validators.service";

describe(ConventionalConfigHelpersService, () => {
  let service: ConventionalConfigHelpersService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ConventionalConfigHelpersService,
        {
          provide: ConventionalConfigConstantsService,
          useValue: createMock<ConventionalConfigConstantsService>(),
        },
        {
          provide: ConventionalConfigIoService,
          useValue: createMock<ConventionalConfigIoService>(),
        },
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
        {
          provide: ConventionalConfigValidatorsService,
          useValue: createMock<ConventionalConfigValidatorsService>(),
        },
      ],
    }).compile();

    service = await module.resolve(ConventionalConfigHelpersService);
  });

  it("is defined", () => {
    expect(service).toBeDefined();
  });
});
