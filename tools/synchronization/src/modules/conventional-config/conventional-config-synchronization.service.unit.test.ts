import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { LoggerService } from "../logger/logger.service";

import { ConventionalConfigConstantsService } from "./conventional-config-constants.service";
import { ConventionalConfigIoService } from "./conventional-config-io.service";
import { ConventionalConfigSynchronizationService } from "./conventional-config-synchronization.service";
import { ConventionalConfigValidatorsService } from "./conventional-config-validators.service";

describe(ConventionalConfigSynchronizationService, () => {
  let service: ConventionalConfigSynchronizationService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ConventionalConfigSynchronizationService,
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

    service = await module.resolve(ConventionalConfigSynchronizationService);
  });

  it("is defined", () => {
    expect(service).toBeDefined();
  });
});
