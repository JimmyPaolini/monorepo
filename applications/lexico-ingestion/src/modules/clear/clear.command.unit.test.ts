import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { Lexeme, Translation, Word } from "@monorepo/lexico-entities";

import { LoggerModule } from "../logger/logger.module";

import { ClearCommand } from "./clear.command";
import { ClearService } from "./clear.service";

describe("ClearCommand", () => {
  let command: ClearCommand;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        ClearCommand,
        {
          provide: ClearService,
          useValue: {
            clearDictionary: vi.fn(),
            clearLiterature: vi.fn(),
          },
        },
        { provide: getRepositoryToken(Lexeme), useValue: {} },
        { provide: getRepositoryToken(Translation), useValue: {} },
        { provide: getRepositoryToken(Word), useValue: {} },
      ],
    }).compile();

    command = await module.resolve(ClearCommand);
  });

  it("should be defined", () => {
    expect(command).toBeDefined();
  });
});
