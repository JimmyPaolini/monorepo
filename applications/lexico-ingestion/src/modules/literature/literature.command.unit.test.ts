import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { beforeAll, describe, expect, it } from "vitest";

import { Author, Line, Text, Token, Word } from "@monorepo/lexico-entities";

import { LoggerModule } from "../logger/logger.module";
import { LoggerService } from "../logger/logger.service";
import { NumeralsService } from "../numerals/numerals.service";

import { LiteratureCommand } from "./literature.command";

describe("LiteratureCommand", () => {
  let command: LiteratureCommand;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        LiteratureCommand,
        {
          provide: getRepositoryToken(Author),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Text),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Line),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Token),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Word),
          useValue: {},
        },
        {
          provide: LoggerService,
          useValue: { setContext: () => {} },
        },
        {
          provide: NumeralsService,
          useValue: { toDecimal: () => 1 },
        },
      ],
    }).compile();

    command = await module.resolve(LiteratureCommand);
  });

  it("should be defined", () => {
    expect(command).toBeDefined();
  });
});
