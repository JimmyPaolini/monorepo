/* cspell:ignore amīcus oris */

import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import * as cheerio from "cheerio";
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

import { LoggerService } from "../logger/logger.service";

import { TranslationsService } from "./translations.service";

describe("TranslationsService", () => {
  let service: TranslationsService;
  let translationsRepository: Mocked<Repository<Translation>>;

  beforeAll(async () => {
    const mockTranslationsRepository = {
      find: vi.fn(),
      save: vi.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        TranslationsService,
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

    service = await module.resolve(TranslationsService);
    translationsRepository = await module.resolve(
      getRepositoryToken(Translation),
    );
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is defined", () => {
    expect(service).toBeDefined();
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

    it("should handle multiple references in a single translation", () => {
      const lexeme = new Lexeme();
      const references = service.extractTranslationReferences([
        new Translation("{*amo*} {*amicus*}", lexeme),
      ]);

      expect(references).toEqual(["amo", "amicus"]);
    });

    it("should handle references with spaces and parentheses", () => {
      const lexeme = new Lexeme();
      const references = service.extractTranslationReferences([
        new Translation("{*amor (gen. -oris)*}", lexeme),
      ]);

      expect(references).toEqual(["amor"]);
    });

    it("should return empty array when no references exist", () => {
      const lexeme = new Lexeme();
      const references = service.extractTranslationReferences([
        new Translation("a plain translation", lexeme),
      ]);

      expect(references).toEqual([]);
    });

    it("should ignore empty reference after removing parenthetical qualifier", () => {
      const lexeme = new Lexeme();
      const references = service.extractTranslationReferences([
        new Translation("{*(noun)*}", lexeme),
      ]);

      expect(references).toEqual([]);
    });
  });

  describe("prepareTranslationsForSave", () => {
    it("should preserve IDs of existing translations", () => {
      const lexeme = new Lexeme();
      lexeme.lemma = "amō";
      lexeme.disambiguator = 0;

      const existingTranslation = new Translation("to love");
      existingTranslation.id = "1";
      existingTranslation.createdAt = new Date("2024-01-01");
      existingTranslation.updatedAt = new Date("2024-01-02");
      lexeme.translations = [existingTranslation];

      const translation = new Translation("to love");

      const prepared = service.prepareTranslationsForSave(lexeme, [
        translation,
      ]);

      expect(prepared[0]?.id).toBe("1");
      expect(prepared[0]?.createdAt).toEqual(new Date("2024-01-01"));
      expect(prepared[0]?.updatedAt).toEqual(new Date("2024-01-02"));
    });

    it("should allow empty translation array", () => {
      const lexeme = new Lexeme();
      lexeme.lemma = "est";
      lexeme.disambiguator = 0;
      lexeme.translations = [new Translation("old translation")];

      const prepared = service.prepareTranslationsForSave(lexeme, []);

      expect(prepared).toEqual([]);
    });

    it("should not modify translations with no existing match", () => {
      const lexeme = new Lexeme();
      lexeme.lemma = "rosa";
      lexeme.disambiguator = 0;
      lexeme.translations = [new Translation("old translation")];

      const newTranslation = new Translation("new translation");
      const prepared = service.prepareTranslationsForSave(lexeme, [
        newTranslation,
      ]);

      expect(prepared[0]?.id).toBeUndefined();
    });

    it("should handle lexeme with no translations array", () => {
      const lexeme = new Lexeme();
      lexeme.lemma = "amō";
      lexeme.disambiguator = 0;
      lexeme.translations = null;

      const translation = new Translation("to love");
      const prepared = service.prepareTranslationsForSave(lexeme, [
        translation,
      ]);

      expect(prepared).toHaveLength(1);
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

    it("should return matching translations", async () => {
      const lexeme = new Lexeme();
      lexeme.id = "amor:1";
      lexeme.partOfSpeech = "noun";

      const t1 = new Translation("{*amo*}", lexeme);
      const t2 = new Translation("{*amicus*}", lexeme);
      translationsRepository.find.mockResolvedValue([t1, t2]);

      const result = await service.findTranslationsWithReferences("amor:1");

      expect(result).toEqual([t1, t2]);
    });
  });

  describe("findAllTranslationsWithReferences", () => {
    it("should find all translations with references with default take", async () => {
      const translations: Translation[] = [];
      translationsRepository.find.mockResolvedValue(translations);

      await service.findAllTranslationsWithReferences();

      expect(translationsRepository.find).toHaveBeenCalledWith({
        order: { data: "ASC" },
        relations: { lexeme: true },
        take: 100,
        where: { data: Like("%{*%*}%") },
      });
    });

    it("should respect custom take parameter", async () => {
      const translations: Translation[] = [];
      translationsRepository.find.mockResolvedValue(translations);

      await service.findAllTranslationsWithReferences(50);

      expect(translationsRepository.find).toHaveBeenCalledWith({
        order: { data: "ASC" },
        relations: { lexeme: true },
        take: 50,
        where: { data: Like("%{*%*}%") },
      });
    });
  });

  describe("saveTranslations", () => {
    it("should save translations to repository", async () => {
      const lexeme = new Lexeme();
      const translations = [
        new Translation("love", lexeme),
        new Translation("beloved", lexeme),
      ];

      translationsRepository.save.mockResolvedValue(translations as never);

      const result = await service.saveTranslations(translations);

      expect(translationsRepository.save).toHaveBeenCalledWith(translations);
      expect(result).toEqual(translations);
    });

    it("should handle empty array", async () => {
      translationsRepository.save.mockResolvedValue([] as never);

      const result = await service.saveTranslations([]);

      expect(translationsRepository.save).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
    });
  });

  describe("parseTranslations", () => {
    it("should return empty array when no translation list exists", () => {
      const $ = cheerio.load("<div><p>Some content</p></div>");
      const elt = $("p")[0];
      if (!elt) throw new Error("Element not found");
      const lexeme = new Lexeme();

      const result = service.parseTranslations($, elt, lexeme);

      expect(result).toEqual([]);
    });

    it("should parse translations from li elements", () => {
      const html = `
        <div>
          <p>Translations</p>
          <ol>
            <li>to love</li>
            <li>to cherish</li>
          </ol>
        </div>
      `;
      const $ = cheerio.load(html);
      const elt = $("p")[0];
      if (!elt) throw new Error("Element not found");
      const lexeme = new Lexeme();

      const result = service.parseTranslations($, elt, lexeme);

      expect(result).toHaveLength(2);
      expect(result[0]?.data).toBe("To love");
      expect(result[1]?.data).toBe("To cherish");
    });

    it("should capitalize first letter of translations", () => {
      const html = `
        <div>
          <p>Translations</p>
          <ol>
            <li>small word</li>
          </ol>
        </div>
      `;
      const $ = cheerio.load(html);
      const elt = $("p")[0];
      if (!elt) throw new Error("Element not found");
      const lexeme = new Lexeme();

      const result = service.parseTranslations($, elt, lexeme);

      expect(result[0]?.data).toBe("Small word");
    });

    it("should remove trailing periods", () => {
      const html = `
        <div>
          <p>Translations</p>
          <ol>
            <li>to love.</li>
          </ol>
        </div>
      `;
      const $ = cheerio.load(html);
      const elt = $("p")[0];
      if (!elt) throw new Error("Element not found");
      const lexeme = new Lexeme();

      const result = service.parseTranslations($, elt, lexeme);

      expect(result[0]?.data).toBe("To love");
    });

    it("should skip entries marked as needing translation", () => {
      const html = `
        <div>
          <p>Translations</p>
          <ol>
            <li>This term needs a translation to English</li>
            <li>to love</li>
          </ol>
        </div>
      `;
      const $ = cheerio.load(html);
      const elt = $("p")[0];
      if (!elt) throw new Error("Element not found");
      const lexeme = new Lexeme();

      const result = service.parseTranslations($, elt, lexeme);

      expect(result).toHaveLength(1);
      expect(result[0]?.data).toBe("To love");
    });

    it("should filter out empty translations", () => {
      const html = `
        <div>
          <p>Translations</p>
          <ol>
            <li> </li>
            <li>to love</li>
          </ol>
        </div>
      `;
      const $ = cheerio.load(html);
      const elt = $("p")[0];
      if (!elt) throw new Error("Element not found");
      const lexeme = new Lexeme();

      const result = service.parseTranslations($, elt, lexeme);

      expect(result).toHaveLength(1);
    });

    it("should skip list item containing self link marker", () => {
      const html = `
        <div>
          <p>Translations</p>
          <ol>
            <li>
              skipped
              <span class="form-of-definition-link">
                <a class="selflink" href="#">amo</a>
              </span>
            </li>
            <li>to cherish</li>
          </ol>
        </div>
      `;
      const $ = cheerio.load(html);
      const elt = $("p")[0];
      if (!elt) throw new Error("Element not found");
      const lexeme = new Lexeme();

      const result = service.parseTranslations($, elt, lexeme);

      expect(result).toHaveLength(1);
      expect(result[0]?.data).toBe("To cherish");
    });

    it("should skip form-of links when translation does not match skip regex", () => {
      const html = `
        <div>
          <p>Translations</p>
          <ol>
            <li>
              not a form reference
              <span class="form-of-definition-link">amō</span>
            </li>
          </ol>
        </div>
      `;
      const $ = cheerio.load(html);
      const elt = $("p")[0];
      if (!elt) throw new Error("Element not found");
      const lexeme = new Lexeme();

      const result = service.parseTranslations($, elt, lexeme);

      expect(result).toEqual([]);
    });

    it("should append normalized references for form-of translations", () => {
      const html = `
        <div>
          <p>Translations</p>
          <ol>
            <li>
              alternative spelling of
              <span class="form-of-definition-link">Amō</span>
              <span class="form-of-definition-link">Amīcus</span>
            </li>
          </ol>
        </div>
      `;
      const $ = cheerio.load(html);
      const elt = $("p")[0];
      if (!elt) throw new Error("Element not found");
      const lexeme = new Lexeme();

      const result = service.parseTranslations($, elt, lexeme);

      expect(result).toHaveLength(1);
      expect(result[0]?.data).toContain("{*amo*}");
      expect(result[0]?.data).toContain("{*amicus*}");
    });

    it("should remove nested child lists before reading translation text", () => {
      const html = `
        <div>
          <p>Translations</p>
          <ol>
            <li>
              to love
              <ul><li>nested note</li></ul>
            </li>
          </ol>
        </div>
      `;
      const $ = cheerio.load(html);
      const elt = $("p")[0];
      if (!elt) throw new Error("Element not found");
      const lexeme = new Lexeme();

      const result = service.parseTranslations($, elt, lexeme);

      expect(result[0]?.data).toBe("To love");
    });
  });
});
