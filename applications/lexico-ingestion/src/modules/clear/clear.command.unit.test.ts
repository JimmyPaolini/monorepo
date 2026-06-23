import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  Author,
  Lexeme,
  Line,
  Text,
  Token,
  Translation,
  Word,
} from "@monorepo/lexico-entities";

import { createRepositoryMock } from "../../../testing/mocks";
import { LoggerService } from "../logger/logger.service";

import { ClearCommand } from "./clear.command";

describe(ClearCommand, () => {
  let command: ClearCommand;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ClearCommand,
        {
          provide: getRepositoryToken(Lexeme),
          useValue: createRepositoryMock<Lexeme>(),
        },
        {
          provide: getRepositoryToken(Translation),
          useValue: createRepositoryMock<Translation>(),
        },
        {
          provide: getRepositoryToken(Word),
          useValue: createRepositoryMock<Word>(),
        },
        {
          provide: getRepositoryToken(Line),
          useValue: createRepositoryMock<Line>(),
        },
        {
          provide: getRepositoryToken(Text),
          useValue: createRepositoryMock<Text>(),
        },
        {
          provide: getRepositoryToken(Author),
          useValue: createRepositoryMock<Author>(),
        },
        {
          provide: getRepositoryToken(Token),
          useValue: createRepositoryMock<Token>(),
        },
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    command = await module.resolve(ClearCommand);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is defined", () => {
    expect(command).toBeDefined();
  });

  it("sets logger context", async () => {
    const module = await Test.createTestingModule({
      providers: [
        ClearCommand,
        {
          provide: getRepositoryToken(Lexeme),
          useValue: createRepositoryMock<Lexeme>(),
        },
        {
          provide: getRepositoryToken(Translation),
          useValue: createRepositoryMock<Translation>(),
        },
        {
          provide: getRepositoryToken(Word),
          useValue: createRepositoryMock<Word>(),
        },
        {
          provide: getRepositoryToken(Line),
          useValue: createRepositoryMock<Line>(),
        },
        {
          provide: getRepositoryToken(Text),
          useValue: createRepositoryMock<Text>(),
        },
        {
          provide: getRepositoryToken(Author),
          useValue: createRepositoryMock<Author>(),
        },
        {
          provide: getRepositoryToken(Token),
          useValue: createRepositoryMock<Token>(),
        },
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    const logger = await module.resolve(LoggerService);

    expect(logger.setContext).toHaveBeenCalledWith("ClearCommand");
  });
});
