import { Lexeme } from "@monorepo/lexico-entities";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { FormsService } from "../forms/forms.service";
import { LexemesService } from "../lexemes/lexemes.service";
import { LoggerService } from "../logger/logger.service";
import { PrincipalPartsService } from "../principal-parts/principal-parts.service";
import { PronunciationService } from "../pronunciation/pronunciation.service";
import { TranslationsService } from "../translations/translations.service";
import { WordsService } from "../words/words.service";

import { DictionaryService } from "./dictionary.service";

describe("DictionaryService", () => {
  let service: DictionaryService;
  let lexemesService: any;
  let loggerService: any;
  let translationsService: any;

  beforeAll(async () => {
    const mockRepository = {
      findOne: vi.fn(),
      save: vi.fn(),
      upsert: vi.fn(),
      createQueryBuilder: vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        getCount: vi.fn().mockResolvedValue(0),
      })),
    };

    const mockFormsService = {
      ingestLexemeForms: vi.fn().mockResolvedValue(undefined),
    };
    const mockLexemesService = {
      parseLexemes: vi.fn(),
      upsertLexeme: vi.fn().mockResolvedValue(undefined),
      fetchSavedLexeme: vi.fn(),
      updateLexemePrincipalParts: vi.fn().mockResolvedValue(undefined),
    };
    const mockPrincipalPartsService = {
      parsePrincipalParts: vi
        .fn()
        .mockReturnValue({ principalParts: [], macronizedWord: "" }),
      ingestLexemePrincipalParts: vi.fn().mockResolvedValue(undefined),
    };
    const mockPronunciationService = {
      parsePronunciations: vi.fn().mockReturnValue([]),
      ingestLexemePronunciations: vi.fn().mockResolvedValue(undefined),
    };
    const mockWordsService = {
      ingestLexemeWords: vi.fn().mockResolvedValue(undefined),
    };
    const mockTranslationsService = {
      ingestTranslations: vi.fn().mockResolvedValue(undefined),
      extractTranslationReferences: vi.fn().mockReturnValue([]),
      lexemeExistsInDb: vi.fn().mockResolvedValue(true),
      ingestTranslationReferencesForLexeme: vi
        .fn()
        .mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [
        DictionaryService,
        { provide: getRepositoryToken(Lexeme), useValue: mockRepository },
        { provide: FormsService, useValue: mockFormsService },
        { provide: LexemesService, useValue: mockLexemesService },
        { provide: PrincipalPartsService, useValue: mockPrincipalPartsService },
        { provide: PronunciationService, useValue: mockPronunciationService },
        {
          provide: TranslationsService,
          useValue: mockTranslationsService,
        },
        { provide: WordsService, useValue: mockWordsService },
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

    service = await module.resolve(DictionaryService);
    lexemesService = module.get(LexemesService);
    loggerService = module.get(LoggerService);
    translationsService = module.get(TranslationsService);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("ingestLexeme", () => {
    it("should upsert a new lexeme on first ingestion", async () => {
      const newLexeme = new Lexeme();
      newLexeme.id = "new-id";
      newLexeme.lemma = "amō";
      newLexeme.disambiguator = 0;
      newLexeme.partOfSpeech = "verb";
      newLexeme.etymology = "Indo-European *h₂em-";
      newLexeme.inflection = null;
      newLexeme.principalParts = [];
      newLexeme.pronunciations = [];
      newLexeme.translations = [];
      newLexeme.forms = [];
      newLexeme.forms = [];
      vi.spyOn(lexemesService, "parseLexemes").mockResolvedValue([newLexeme]);
      lexemesService.fetchSavedLexeme.mockResolvedValue(newLexeme);

      await service.ingestLexeme("amo", {
        word: "amō",
        category: "Latin",
        href: "/wiki/amo",
        html: "<html>test</html>",
      });

      expect(lexemesService.upsertLexeme).toHaveBeenCalledWith(newLexeme);
      expect(loggerService.debug).toHaveBeenCalledWith(
        'Upserted lexeme "amō" (disambiguator: 0)',
      );
    });

    it("should upsert lexeme and manage relations", async () => {
      const existingLexeme = new Lexeme();
      existingLexeme.id = "existing-id";
      existingLexeme.lemma = "amō";
      existingLexeme.disambiguator = 0;
      existingLexeme.partOfSpeech = "verb";
      existingLexeme.etymology = "Old etymology";
      existingLexeme.principalParts = [];
      existingLexeme.pronunciations = [];
      existingLexeme.translations = [];
      existingLexeme.forms = [];

      const updatedLexeme = new Lexeme();
      updatedLexeme.lemma = "amō";
      updatedLexeme.disambiguator = 0;
      updatedLexeme.partOfSpeech = "verb";
      updatedLexeme.etymology = "New etymology";
      updatedLexeme.principalParts = [];
      updatedLexeme.pronunciations = [];
      updatedLexeme.translations = [];
      updatedLexeme.forms = [];

      vi.spyOn(lexemesService, "parseLexemes").mockResolvedValue([
        updatedLexeme,
      ]);

      // Mock upsert to succeed
      lexemesService.upsertLexeme.mockResolvedValue(undefined);

      // Mock findOne to return existing lexeme with relations
      lexemesService.fetchSavedLexeme.mockResolvedValue(existingLexeme);

      await service.ingestLexeme("amo", {
        word: "amō",
        category: "Latin",
        href: "/wiki/amo",
        html: "<html>test</html>",
      });

      // Should call upsert
      expect(lexemesService.upsertLexeme).toHaveBeenCalledWith(updatedLexeme);

      // Should fetch the upserted lexeme
      expect(lexemesService.fetchSavedLexeme).toHaveBeenCalledWith("amō", 0);

      // Should delegate translation persistence to TranslationsService
      expect(translationsService.ingestTranslations).toHaveBeenCalledWith(
        existingLexeme,
        updatedLexeme.translations,
      );

      expect(loggerService.debug).toHaveBeenCalledWith(
        'Upserted lexeme "amō" (disambiguator: 0)',
      );
    });

    it("should handle inflection separately before upsert", async () => {
      const inflectionMock = {
        save: vi.fn().mockResolvedValue(undefined),
      } as any;

      const newLexeme = new Lexeme();
      newLexeme.id = "new-id";
      newLexeme.lemma = "amō";
      newLexeme.disambiguator = 0;
      newLexeme.partOfSpeech = "verb";
      newLexeme.inflection = inflectionMock;
      newLexeme.principalParts = [];
      newLexeme.pronunciations = [];
      newLexeme.translations = [];
      newLexeme.forms = [];

      vi.spyOn(lexemesService, "parseLexemes").mockResolvedValue([newLexeme]);
      lexemesService.upsertLexeme.mockResolvedValue(undefined);
      lexemesService.fetchSavedLexeme.mockResolvedValue(newLexeme);

      await service.ingestLexeme("amo", {
        word: "amō",
        category: "Latin",
        href: "/wiki/amo",
        html: "<html>test</html>",
      });

      expect(lexemesService.upsertLexeme).toHaveBeenCalledWith(newLexeme);
    });

    it("should resolve translation references for the lexeme after persisting", async () => {
      const savedLexeme = new Lexeme();
      savedLexeme.id = "amor:1";
      savedLexeme.lemma = "amor";
      savedLexeme.disambiguator = 0;
      savedLexeme.partOfSpeech = "noun";
      savedLexeme.inflection = null;
      savedLexeme.principalParts = [];
      savedLexeme.pronunciations = [];
      savedLexeme.translations = [];
      savedLexeme.forms = [];

      vi.spyOn(lexemesService, "parseLexemes").mockResolvedValue([savedLexeme]);
      lexemesService.upsertLexeme.mockResolvedValue(undefined);
      lexemesService.fetchSavedLexeme.mockResolvedValue(savedLexeme);

      await service.ingestLexeme("amor", {
        word: "amor",
        category: "Latin",
        href: "/wiki/amor",
        html: "<html>test</html>",
      });

      expect(
        translationsService.ingestTranslationReferencesForLexeme,
      ).toHaveBeenCalledWith("amor:1");
    });
  });
});
