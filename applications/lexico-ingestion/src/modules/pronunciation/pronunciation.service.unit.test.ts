import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { beforeAll, describe, expect, it } from "vitest";

import { Lexeme } from "@monorepo/lexico-entities";

import { LoggerService } from "../logger/logger.service";

import { PronunciationService } from "./pronunciation.service";

describe("PronunciationService", () => {
  let service: PronunciationService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PronunciationService,
        { provide: getRepositoryToken(Lexeme), useValue: {} },
        {
          provide: LoggerService,
          useValue: { log: () => {}, setContext: () => {} },
        },
      ],
    }).compile();

    service = await module.resolve(PronunciationService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
