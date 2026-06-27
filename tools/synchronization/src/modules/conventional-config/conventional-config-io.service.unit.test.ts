import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { LoggerService } from "../logger/logger.service";

import { ConventionalConfigIoService } from "./conventional-config-io.service";

describe(ConventionalConfigIoService, () => {
  let service: ConventionalConfigIoService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ConventionalConfigIoService,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    service = await module.resolve(ConventionalConfigIoService);
  });

  it("is defined", () => {
    expect(service).toBeDefined();
  });
});
