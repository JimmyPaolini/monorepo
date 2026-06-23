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

import {
  createRepositoryMock,
  setPromptsMockResponse,
} from "../../../testing/mocks";
import { LoggerService } from "../logger/logger.service";

import { ClearCommand } from "./clear.command";

import type { Repository } from "typeorm";

const { promptsMock } = vi.hoisted(() => ({
  promptsMock:
    vi.fn<() => Promise<{ dictionary: boolean; literature: boolean }>>(),
}));

vi.mock("prompts", () => ({
  default: promptsMock,
}));

describe(ClearCommand, () => {
  let command: ClearCommand;
  let lexemesRepository: Repository<Lexeme>;
  let translationsRepository: Repository<Translation>;
  let wordsRepository: Repository<Word>;
  let linesRepository: Repository<Line>;
  let textsRepository: Repository<Text>;
  let authorsRepository: Repository<Author>;
  let tokensRepository: Repository<Token>;

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
    lexemesRepository = module.get(getRepositoryToken(Lexeme));
    translationsRepository = module.get(getRepositoryToken(Translation));
    wordsRepository = module.get(getRepositoryToken(Word));
    linesRepository = module.get(getRepositoryToken(Line));
    textsRepository = module.get(getRepositoryToken(Text));
    authorsRepository = module.get(getRepositoryToken(Author));
    tokensRepository = module.get(getRepositoryToken(Token));
  });

  beforeEach(() => {
    vi.clearAllMocks();
    setPromptsMockResponse(promptsMock, {
      dictionary: true,
      literature: true,
    });
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

  it("parses dictionary and literature boolean options", () => {
    expect(command.parseDictionary(undefined)).toBe(true);
    expect(command.parseDictionary("false")).toBe(false);
    expect(command.parseDictionary("0")).toBe(false);
    expect(command.parseDictionary("true")).toBe(true);

    expect(command.parseLiterature(undefined)).toBe(true);
    expect(command.parseLiterature("false")).toBe(false);
    expect(command.parseLiterature("0")).toBe(false);
    expect(command.parseLiterature("true")).toBe(true);
  });

  it("prompts and clears both dictionary and literature when options are missing", async () => {
    await command.run([], {});

    expect(promptsMock).toHaveBeenCalledTimes(1);

    expect(wordsRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(translationsRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(lexemesRepository.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(tokensRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(linesRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(textsRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(authorsRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
  });

  it("clears only dictionary data when literature is disabled", async () => {
    await command.run([], {
      dictionary: true,
      literature: false,
    });

    expect(promptsMock).not.toHaveBeenCalled();

    expect(wordsRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(translationsRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(lexemesRepository.createQueryBuilder).toHaveBeenCalledTimes(1);

    expect(tokensRepository.createQueryBuilder).not.toHaveBeenCalled();
    expect(linesRepository.createQueryBuilder).not.toHaveBeenCalled();
    expect(textsRepository.createQueryBuilder).not.toHaveBeenCalled();
    expect(authorsRepository.createQueryBuilder).not.toHaveBeenCalled();
  });

  it("clears only literature data when dictionary is disabled", async () => {
    await command.run([], {
      dictionary: false,
      literature: true,
    });

    expect(promptsMock).not.toHaveBeenCalled();

    expect(wordsRepository.createQueryBuilder).not.toHaveBeenCalled();
    expect(translationsRepository.createQueryBuilder).not.toHaveBeenCalled();
    expect(lexemesRepository.createQueryBuilder).not.toHaveBeenCalled();

    expect(tokensRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(linesRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(textsRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(authorsRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
  });

  it("skips all deletion when both dictionary and literature are disabled", async () => {
    await command.run([], {
      dictionary: false,
      literature: false,
    });

    expect(promptsMock).not.toHaveBeenCalled();

    expect(wordsRepository.createQueryBuilder).not.toHaveBeenCalled();
    expect(translationsRepository.createQueryBuilder).not.toHaveBeenCalled();
    expect(lexemesRepository.createQueryBuilder).not.toHaveBeenCalled();
    expect(tokensRepository.createQueryBuilder).not.toHaveBeenCalled();
    expect(linesRepository.createQueryBuilder).not.toHaveBeenCalled();
    expect(textsRepository.createQueryBuilder).not.toHaveBeenCalled();
    expect(authorsRepository.createQueryBuilder).not.toHaveBeenCalled();
  });
});
