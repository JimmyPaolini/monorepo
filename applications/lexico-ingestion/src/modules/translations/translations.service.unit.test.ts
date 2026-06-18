import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Like, type Repository } from "typeorm";
import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  type Mocked,
  vi,
} from "vitest";

import { Lexeme, Translation } from "@monorepo/lexico-entities";

import { LexemesService } from "../lexemes/lexemes.service";
import { LoggerService } from "../logger/logger.service";

import { TranslationsService } from "./translations.service";

describe("TranslationsService", () => {
  let service: TranslationsService;
  let translationsRepository: Mocked<Repository<Translation>>;

  beforeAll(async () => {
    const mockLexemesService = {
      findLexemesByLemmaWithTranslations: vi.fn().mockResolvedValue([]),
    };

    const mockTranslationsRepository = {
      find: vi.fn(),
      save: vi.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        TranslationsService,
        {
          provide: LexemesService,
          useValue: mockLexemesService,
        },
        {
          provide: getRepositoryToken(Translation),
          useValue: mockTranslationsRepository,
        },
        {
          provide: LoggerService,
          useValue: {
            debug: vi.fn(),
            error: vi.fn(),
            log: vi.fn(),
            setContext: vi.fn(),
            verbose: vi.fn(),
            warn: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(TranslationsService);
    translationsRepository = module.get(getRepositoryToken(Translation));
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("prepareTranslationsForSave", () => {
    it("should preserve IDs of existing translations", () => {
      const lexeme = new Lexeme();
      lexeme.lemma = "amō";
      lexeme.disambiguator = 0;

      const existingTranslation = new Translation("to love");
      existingTranslation.id = "1";
      lexeme.translations = [existingTranslation];

      const translation = new Translation("to love");

      const prepared = service.prepareTranslationsForSave(lexeme, [
        translation,
      ]);

      expect(prepared[0]?.id).toBe("1");
    });

    it("should allow empty array", () => {
      const lexeme = new Lexeme();
      lexeme.lemma = "est";
      lexeme.disambiguator = 0;
      lexeme.translations = [new Translation("old translation")];

      const prepared = service.prepareTranslationsForSave(lexeme, []);

      expect(prepared).toEqual([]);
    });
  });

  describe("findTranslationsWithReferences", () => {
    it("should query translations only for the given lexeme id", async () => {
      translationsRepository.find.mockResolvedValue([]);

      await service.findTranslationsWithReferences("amor:1");

      expect(translationsRepository.find).toHaveBeenCalledWith({
        relations: { lexeme: true },
        where: { data: Like("%{*%*}%"), lexeme: { id: "amor:1" } },
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

      await service.findTranslationsWithReferences("amor:1");

      expect(translationsRepository.find).toHaveBeenCalledTimes(1);
    });
  });

  describe("extractTranslationReferences", () => {
    it("should extract unique reference strings from translation text", () => {
      const lexeme = new Lexeme();
      const references = service.extractTranslationReferences([
        new Translation("{*amo*}", lexeme),
        new Translation("{*amicus*}", lexeme),
        new Translation("{*amo*}", lexeme),
      ]);

      expect(references).toEqual(["amo", "amicus"]);
    });

    it("should strip parenthetical qualifiers from references", () => {
      const lexeme = new Lexeme();
      const references = service.extractTranslationReferences([
        new Translation("{*amor (noun)*}", lexeme),
      ]);

      expect(references).toEqual(["amor"]);
    });
  });
});
