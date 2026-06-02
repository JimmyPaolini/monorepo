import { Lexeme, Translation } from "@monorepo/lexico-entities";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LoggerService } from "../logger/logger.service";

import { TranslationsService } from "./translations.service";

describe("TranslationsService", () => {
  let service: TranslationsService;
  let lexemesRepository: any;
  let translationsRepository: any;

  beforeAll(async () => {
    const mockLexemesRepository = {
      save: vi.fn(),
      createQueryBuilder: vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        getCount: vi.fn().mockResolvedValue(0),
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
      })),
    };

    const mockTranslationsRepository = {
      find: vi.fn(),
      save: vi.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        TranslationsService,
        {
          provide: getRepositoryToken(Lexeme),
          useValue: mockLexemesRepository,
        },
        {
          provide: getRepositoryToken(Translation),
          useValue: mockTranslationsRepository,
        },
        {
          provide: LoggerService,
          useValue: {
            setContext: vi.fn(),
            log: vi.fn(),
            warn: vi.fn(),
            error: vi.fn(),
            debug: vi.fn(),
            verbose: vi.fn(),
          },
        },
      ],
    }).compile();

    service = await module.resolve(TranslationsService);
    lexemesRepository = module.get(getRepositoryToken(Lexeme));
    translationsRepository = module.get(getRepositoryToken(Translation));
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("ingestTranslations", () => {
    it("should assign translations onto the lexeme and save", async () => {
      const lexeme = new Lexeme();
      lexeme.lemma = "amō";
      lexeme.disambiguator = 0;
      lexeme.translations = [];

      const translation = new Translation("to love");

      lexemesRepository.save.mockResolvedValue(lexeme);

      await service.ingestTranslations(lexeme, [translation]);

      expect(lexeme.translations).toEqual([translation]);
      expect(lexemesRepository.save).toHaveBeenCalledWith(lexeme);
    });

    it("should save with an empty translations array", async () => {
      const lexeme = new Lexeme();
      lexeme.lemma = "est";
      lexeme.disambiguator = 0;
      lexeme.translations = [new Translation("old translation")];

      lexemesRepository.save.mockResolvedValue(lexeme);

      await service.ingestTranslations(lexeme, []);

      expect(lexeme.translations).toEqual([]);
      expect(lexemesRepository.save).toHaveBeenCalledWith(lexeme);
    });
  });

  describe("ingestTranslationReferencesForLexeme", () => {
    it("should query translations only for the given lexeme id", async () => {
      translationsRepository.find.mockResolvedValue([]);

      await service.ingestTranslationReferencesForLexeme("amor:1");

      expect(translationsRepository.find).toHaveBeenCalledWith({
        where: { lexeme: { id: "amor:1" }, translation: expect.anything() },
        relations: ["lexeme"],
      });
    });

    it("should resolve each matching translation", async () => {
      const lexeme = new Lexeme();
      lexeme.id = "amor:1";
      lexeme.partOfSpeech = "noun";

      const t1 = new Translation("{*amo*}", lexeme);
      const t2 = new Translation("{*amicus*}", lexeme);
      translationsRepository.find.mockResolvedValue([t1, t2]);
      translationsRepository.save = vi.fn().mockResolvedValue(undefined);

      await service.ingestTranslationReferencesForLexeme("amor:1");

      expect(translationsRepository.find).toHaveBeenCalledTimes(1);
    });
  });

  describe("extractTranslationReferences", () => {
    it("should extract unique reference strings from translation text", () => {
      const lexeme = new Lexeme();
      const refs = service.extractTranslationReferences([
        new Translation("{*amo*}", lexeme),
        new Translation("{*amicus*}", lexeme),
        new Translation("{*amo*}", lexeme),
      ]);

      expect(refs).toEqual(["amo", "amicus"]);
    });

    it("should strip parenthetical qualifiers from references", () => {
      const lexeme = new Lexeme();
      const refs = service.extractTranslationReferences([
        new Translation("{*amor (noun)*}", lexeme),
      ]);

      expect(refs).toEqual(["amor"]);
    });
  });
});
