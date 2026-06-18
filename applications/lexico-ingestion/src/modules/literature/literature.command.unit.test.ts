import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { LoggerModule } from "../logger/logger.module";
import { LoggerService } from "../logger/logger.service";

import { LiteratureCommand } from "./literature.command";
import { LiteratureService } from "./literature.service";

describe("LiteratureCommand", () => {
  let command: LiteratureCommand;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        LiteratureCommand,
        {
          provide: LiteratureService,
          useValue: {},
        },
        {
          provide: LoggerService,
          useValue: { setContext: () => {} },
        },
      ],
    }).compile();

    command = await module.resolve(LiteratureCommand);
  });

  it("should be defined", () => {
    expect(command).toBeDefined();
  });
});
