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

import { LoggerModule } from "../logger/logger.module";
import { LoggerService } from "../logger/logger.service";

import { ClearCommand } from "./clear.command";

const { promptsMock } = vi.hoisted(() => ({
  promptsMock:
    vi.fn<() => Promise<{ dictionary: boolean; literature: boolean }>>(),
}));

vi.mock("prompts", () => ({
  default: promptsMock,
}));

interface QueryBuilderMock {
  delete: () => QueryBuilderMock;
  execute: () => Promise<void>;
}

interface RepositoryMock {
  createQueryBuilder: () => QueryBuilderMock;
}

function createLoggerServiceMock(): {
  log: ReturnType<typeof vi.fn>;
  setContext: ReturnType<typeof vi.fn>;
} {
  return {
    log: vi.fn(),
    setContext: vi.fn(),
  };
}

function createRepositoryMock(): {
  executeMock: ReturnType<typeof vi.fn>;
  repositoryMock: RepositoryMock;
} {
  const executeMock = vi.fn<() => Promise<void>>(async () => {});
  const queryBuilder: QueryBuilderMock = {
    delete: () => queryBuilder,
    execute: async () => executeMock(),
  };

  return {
    executeMock,
    repositoryMock: {
      createQueryBuilder: () => queryBuilder,
    },
  };
}

describe(ClearCommand, () => {
  let command: ClearCommand;
  let clearCommand: ClearCommand;

  const loggerService = {
    log: vi.fn<(...parameters: unknown[]) => void>(),
    setContext: vi.fn<(context: string) => void>(),
  };

  const lexemesRepository = createRepositoryMock();
  const translationsRepository = createRepositoryMock();
  const wordsRepository = createRepositoryMock();
  const linesRepository = createRepositoryMock();
  const textsRepository = createRepositoryMock();
  const authorsRepository = createRepositoryMock();
  const tokensRepository = createRepositoryMock();

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        ClearCommand,
        {
          provide: LoggerService,
          useValue: createLoggerServiceMock(),
        },
      ],
    }).compile();

    command = await module.resolve(ClearCommand);
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        ClearCommand,
        { provide: LoggerService, useValue: loggerService },
        {
          provide: getRepositoryToken(Lexeme),
          useValue: lexemesRepository.repositoryMock,
        },
        {
          provide: getRepositoryToken(Translation),
          useValue: translationsRepository.repositoryMock,
        },
        {
          provide: getRepositoryToken(Word),
          useValue: wordsRepository.repositoryMock,
        },
        {
          provide: getRepositoryToken(Line),
          useValue: linesRepository.repositoryMock,
        },
        {
          provide: getRepositoryToken(Text),
          useValue: textsRepository.repositoryMock,
        },
        {
          provide: getRepositoryToken(Author),
          useValue: authorsRepository.repositoryMock,
        },
        {
          provide: getRepositoryToken(Token),
          useValue: tokensRepository.repositoryMock,
        },
      ],
    }).compile();

    clearCommand = await moduleRef.resolve(ClearCommand);
  });

  it("is defined", () => {
    expect(command).toBeDefined();
  });

  it("should initialize command with logger context", () => {
    expect.hasAssertions();
    expect(clearCommand).toBeDefined();
    expect(loggerService.setContext).toHaveBeenCalledWith("ClearCommand");
  });

  it("should clear dictionary only when dictionary option is true", async () => {
    await clearCommand.run([], { dictionary: true, literature: false });

    expect(wordsRepository.executeMock).toHaveBeenCalledTimes(1);
    expect(translationsRepository.executeMock).toHaveBeenCalledTimes(1);
    expect(lexemesRepository.executeMock).toHaveBeenCalledTimes(1);

    expect(tokensRepository.executeMock).not.toHaveBeenCalled();
    expect(linesRepository.executeMock).not.toHaveBeenCalled();
    expect(textsRepository.executeMock).not.toHaveBeenCalled();
    expect(authorsRepository.executeMock).not.toHaveBeenCalled();
  });

  it("should clear literature only when literature option is true", async () => {
    await clearCommand.run([], { dictionary: false, literature: true });

    expect(tokensRepository.executeMock).toHaveBeenCalledTimes(1);
    expect(linesRepository.executeMock).toHaveBeenCalledTimes(1);
    expect(textsRepository.executeMock).toHaveBeenCalledTimes(1);
    expect(authorsRepository.executeMock).toHaveBeenCalledTimes(1);

    expect(wordsRepository.executeMock).not.toHaveBeenCalled();
    expect(translationsRepository.executeMock).not.toHaveBeenCalled();
    expect(lexemesRepository.executeMock).not.toHaveBeenCalled();
  });

  it("should prompt for options when none are provided", async () => {
    promptsMock.mockResolvedValue({ dictionary: true, literature: true });

    await clearCommand.run([], {});

    expect(promptsMock).toHaveBeenCalledTimes(1);
    expect(tokensRepository.executeMock).toHaveBeenCalledTimes(1);
    expect(linesRepository.executeMock).toHaveBeenCalledTimes(1);
    expect(textsRepository.executeMock).toHaveBeenCalledTimes(1);
    expect(authorsRepository.executeMock).toHaveBeenCalledTimes(1);
    expect(wordsRepository.executeMock).toHaveBeenCalledTimes(1);
    expect(translationsRepository.executeMock).toHaveBeenCalledTimes(1);
    expect(lexemesRepository.executeMock).toHaveBeenCalledTimes(1);
    expect(loggerService.log).toHaveBeenCalledWith("Running clear command");
  });
});
