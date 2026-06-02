import { Lexeme, Translation, Word } from "@monorepo/lexico-entities";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LexemesService } from "../lexemes/lexemes.service";
import { LoggerService } from "../logger/logger.service";
import { PartOfSpeechService } from "../part-of-speech/part-of-speech.service";
import { PronunciationService } from "../pronunciation/pronunciation.service";

import { DictionaryService } from "./dictionary.service";

describe("DictionaryService", () => {
  let service: DictionaryService;
  let lexemeRepository: any;
  let lexemesService: any;
  let loggerService: any;

  beforeAll(async () => {
    const mockRepository = {
      findOne: vi.fn(),
      save: vi.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        DictionaryService,
        LexemesService,
        PartOfSpeechService,
        PronunciationService,
        { provide: getRepositoryToken(Lexeme), useValue: mockRepository },
        { provide: getRepositoryToken(Word), useValue: {} },
        { provide: getRepositoryToken(Translation), useValue: {} },
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
    lexemeRepository = module.get(getRepositoryToken(Lexeme));
    lexemesService = module.get(LexemesService);
    loggerService = module.get(LoggerService);
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

      vi.spyOn(lexemesService, "parseLexemes").mockResolvedValue([newLexeme]);
      lexemeRepository.upsert = vi.fn().mockResolvedValue(undefined);
      lexemeRepository.findOne.mockResolvedValue(newLexeme);
      lexemeRepository.save.mockResolvedValue(newLexeme);

      await service.ingestLexeme("amo", {
        word: "amō",
        category: "Latin",
        href: "/wiki/amo",
        html: "<html>test</html>",
      });

      expect(lexemeRepository.upsert).toHaveBeenCalledWith(newLexeme, {
        conflictPaths: ["lemma", "disambiguator"],
        skipUpdateIfNoValuesChanged: false,
      });
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

      const updatedLexeme = new Lexeme();
      updatedLexeme.lemma = "amō";
      updatedLexeme.disambiguator = 0;
      updatedLexeme.partOfSpeech = "verb";
      updatedLexeme.etymology = "New etymology";
      updatedLexeme.principalParts = [];
      updatedLexeme.pronunciations = [];
      updatedLexeme.translations = [];

      vi.spyOn(lexemesService, "parseLexemes").mockResolvedValue([
        updatedLexeme,
      ]);

      // Mock upsert to succeed
      lexemeRepository.upsert = vi.fn().mockResolvedValue(undefined);

      // Mock findOne to return existing lexeme with relations
      lexemeRepository.findOne.mockResolvedValue(existingLexeme);

      // Mock save for clearing and updating relations
      lexemeRepository.save.mockResolvedValue(existingLexeme);

      await service.ingestLexeme("amo", {
        word: "amō",
        category: "Latin",
        href: "/wiki/amo",
        html: "<html>test</html>",
      });

      // Should call upsert with correct conflict paths
      expect(lexemeRepository.upsert).toHaveBeenCalledWith(updatedLexeme, {
        conflictPaths: ["lemma", "disambiguator"],
        skipUpdateIfNoValuesChanged: false,
      });

      // Should fetch the upserted lexeme with relations
      expect(lexemeRepository.findOne).toHaveBeenCalledWith({
        where: {
          lemma: "amō",
          disambiguator: 0,
        },
        relations: [
          "principalParts",
          "pronunciations",
          "translations",
          "inflection",
        ],
      });

      // Should clear and update relations (2 save calls)
      expect(lexemeRepository.save).toHaveBeenCalledTimes(2);

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

      vi.spyOn(lexemesService, "parseLexemes").mockResolvedValue([newLexeme]);
      lexemeRepository.upsert = vi.fn().mockResolvedValue(undefined);
      lexemeRepository.findOne.mockResolvedValue(newLexeme);
      lexemeRepository.save.mockResolvedValue(newLexeme);

      await service.ingestLexeme("amo", {
        word: "amō",
        category: "Latin",
        href: "/wiki/amo",
        html: "<html>test</html>",
      });

      // Inflection should be saved first
      expect(inflectionMock.save).toHaveBeenCalled();
      expect(lexemeRepository.upsert).toHaveBeenCalledWith(newLexeme, {
        conflictPaths: ["lemma", "disambiguator"],
        skipUpdateIfNoValuesChanged: false,
      });
    });
  });
});
