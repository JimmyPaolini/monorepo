import { Lexeme } from "@monorepo/lexico-entities";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { beforeAll, describe, expect, it } from "vitest";

import { LoggerService } from "../logger/logger.service";

import { PrincipalPartsService } from "./principal-parts.service";

describe("PrincipalPartsService", () => {
  let service: PrincipalPartsService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PrincipalPartsService,
        { provide: getRepositoryToken(Lexeme), useValue: {} },
        {
          provide: LoggerService,
          useValue: { setContext: () => {}, log: () => {} },
        },
      ],
    }).compile();

    service = await module.resolve(PrincipalPartsService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
