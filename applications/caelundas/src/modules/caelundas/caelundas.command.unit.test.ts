import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { CalendarService } from "../calendar/calendar.service";
import { InputService } from "../input/input.service";
import { LoggerService } from "../logger/logger.service";
import { PerfectiveService } from "../perfective/perfective.service";
import { ProgressiveService } from "../progressive/progressive.service";

import { CaelundasCommand } from "./caelundas.command";

describe(CaelundasCommand, () => {
  let command: CaelundasCommand;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CaelundasCommand,
        { provide: LoggerService, useValue: createMock<LoggerService>() },
        { provide: InputService, useValue: createMock<InputService>() },
        {
          provide: PerfectiveService,
          useValue: createMock<PerfectiveService>(),
        },
        {
          provide: ProgressiveService,
          useValue: createMock<ProgressiveService>(),
        },
        { provide: CalendarService, useValue: createMock<CalendarService>() },
      ],
    }).compile();

    command = await module.resolve(CaelundasCommand);
  });

  it("is defined", () => {
    expect(command).toBeDefined();
  });

  it("sets logger context", async () => {
    const module = await Test.createTestingModule({
      providers: [
        CaelundasCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
        {
          provide: InputService,
          useValue: createMock<InputService>(),
        },
        {
          provide: PerfectiveService,
          useValue: createMock<PerfectiveService>(),
        },
        {
          provide: ProgressiveService,
          useValue: createMock<ProgressiveService>(),
        },
        {
          provide: CalendarService,
          useValue: createMock<CalendarService>(),
        },
      ],
    }).compile();

    const logger = await module.resolve(LoggerService);

    expect(logger.setContext).toHaveBeenCalledWith("CaelundasCommand");
  });
});
