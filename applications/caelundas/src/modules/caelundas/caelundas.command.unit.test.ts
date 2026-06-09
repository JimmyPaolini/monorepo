import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { CalendarService } from "../calendar/calendar.service";
import { InputService } from "../input/input.service";
import { LoggerService } from "../logger/logger.service";
import { PerfectiveService } from "../perfective/perfective.service";
import { ProgressiveService } from "../progressive/progressive.service";

import { CaelundasCommand } from "./caelundas.command";

describe("CaelundasCommand", () => {
  let command: CaelundasCommand;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CaelundasCommand,
        { provide: LoggerService, useValue: { setContext: () => {} } },
        { provide: InputService, useValue: {} },
        { provide: PerfectiveService, useValue: {} },
        { provide: ProgressiveService, useValue: {} },
        { provide: CalendarService, useValue: {} },
      ],
    }).compile();

    command = await module.resolve(CaelundasCommand);
  });

  it("should be defined", () => {
    expect(command).toBeDefined();
  });
});
