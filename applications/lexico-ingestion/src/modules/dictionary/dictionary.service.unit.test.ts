import { type Inflection, Lexeme } from "@monorepo/lexico-entities";
import { Test } from "@nestjs/testing";
import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  type Mocked,
  vi,
} from "vitest";

import { LexemesService } from "../lexemes/lexemes.service";
import { LoggerService } from "../logger/logger.service";
import { TranslationsService } from "../translations/translations.service";

import { DictionaryService } from "./dictionary.service";

describe("DictionaryService", () => {
  let service: DictionaryService;
  let lexemesService: Mocked<LexemesService>;
  let translationsService: Mocked<TranslationsService>;

  beforeAll(async () => {
    const mockLexemesService = {
      parseLexemes: vi.fn(),
      saveParsedLexeme: vi.fn().mockResolvedValue(undefined),
      existsByLemma: vi.fn().mockResolvedValue(true),
    };

    const mockTranslationsService = {
      findTranslationsWithReferences: vi.fn().mockResolvedValue([]),
      extractTranslationReferences: vi.fn().mockReturnValue([]),
    };

    const module = await Test.createTestingModule({
      providers: [
        DictionaryService,
        { provide: LexemesService, useValue: mockLexemesService },
        {
          provide: TranslationsService,
          useValue: mockTranslationsService,
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

    service = await module.resolve(DictionaryService);
    lexemesService = module.get(LexemesService);
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

      vi.spyOn(lexemesService, "parseLexemes").mockResolvedValue([newLexeme]);
      lexemesService.saveParsedLexeme.mockResolvedValue(newLexeme);
      translationsService.extractTranslationReferences.mockReturnValue([]);

      await service.ingestLexeme("amo", {
        word: "amō",
        category: "Latin",
        href: "/wiki/amo",
        html: "<html>test</html>",
      });

      expect(lexemesService.saveParsedLexeme).toHaveBeenCalledWith(newLexeme);
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
      updatedLexeme.id = "existing-id";
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

      lexemesService.saveParsedLexeme.mockResolvedValue(updatedLexeme);
      translationsService.extractTranslationReferences.mockReturnValue([]);

      await service.ingestLexeme("amo", {
        word: "amō",
        category: "Latin",
        href: "/wiki/amo",
        html: "<html>test</html>",
      });

      // Should call saveParsedLexeme
      expect(lexemesService.saveParsedLexeme).toHaveBeenCalledWith(
        updatedLexeme,
      );
    });

    it("should handle inflection separately before upsert", async () => {
      const inflectionMock = {
        save: vi.fn().mockResolvedValue(undefined),
      } as unknown as Inflection;

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

      lexemesService.parseLexemes.mockResolvedValue([newLexeme]);
      lexemesService.saveParsedLexeme.mockResolvedValue(newLexeme);

      await service.ingestLexeme("amo", {
        word: "amō",
        category: "Latin",
        href: "/wiki/amo",
        html: "<html>test</html>",
      });

      expect(lexemesService.saveParsedLexeme).toHaveBeenCalledWith(newLexeme);
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

      lexemesService.parseLexemes.mockResolvedValue([savedLexeme]);
      lexemesService.saveParsedLexeme.mockResolvedValue(savedLexeme);
      translationsService.extractTranslationReferences.mockReturnValue(["amō"]);
      lexemesService.existsByLemma.mockResolvedValue(true);

      await service.ingestLexeme("amor", {
        word: "amor",
        category: "Latin",
        href: "/wiki/amor",
        html: "<html>test</html>",
      });

      expect(lexemesService.saveParsedLexeme).toHaveBeenCalledWith(savedLexeme);
      expect(
        translationsService.findTranslationsWithReferences,
      ).toHaveBeenCalledWith("amor:1");
    });
  });
});
