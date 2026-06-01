import { Lexeme, Translation } from "@monorepo/lexico-entities";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { beforeAll, describe, expect, it } from "vitest";

import { TranslationReferencesService } from "./translation-references.service";

describe("TranslationReferencesService", () => {
  let service: TranslationReferencesService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        TranslationReferencesService,
        { provide: getRepositoryToken(Lexeme), useValue: {} },
        { provide: getRepositoryToken(Translation), useValue: {} },
      ],
    }).compile();

    service = await module.resolve(TranslationReferencesService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
