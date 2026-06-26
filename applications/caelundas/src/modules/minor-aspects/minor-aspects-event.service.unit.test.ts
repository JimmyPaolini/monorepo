import { AspectsUtilities } from "@caelundas/src/modules/aspects/aspects.utilities";
import { SimpleAspectsEventService } from "@caelundas/src/modules/aspects/simple-aspects-event.service";
import { EphemerisService } from "@caelundas/src/modules/ephemeris/ephemeris.service";
import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { LoggerService } from "../logger/logger.service";

import { MinorAspectsEventService } from "./minor-aspects-event.service";

describe(MinorAspectsEventService, () => {
  let service: MinorAspectsEventService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MinorAspectsEventService,
        { provide: LoggerService, useValue: createMock<LoggerService>() },
        {
          provide: AspectsUtilities,
          useValue: createMock<AspectsUtilities>(),
        },
        {
          provide: SimpleAspectsEventService,
          useValue: createMock<SimpleAspectsEventService>(),
        },
        { provide: EphemerisService, useValue: createMock<EphemerisService>() },
      ],
    }).compile();

    service = await module.resolve(MinorAspectsEventService);
  });

  it("is defined", () => {
    expect(service).toBeDefined();
  });
});
