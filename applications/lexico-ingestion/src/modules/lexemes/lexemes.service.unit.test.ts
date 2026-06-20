import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import * as cheerio from "cheerio";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { Lexeme, Translation } from "@monorepo/lexico-entities";

import { EtymologyService } from "../etymology/etymology.service";
import { FormsService } from "../forms/forms.service";
import { LoggerService } from "../logger/logger.service";
import { PartOfSpeechService } from "../part-of-speech/part-of-speech.service";
import { PrincipalPartsService } from "../principal-parts/principal-parts.service";
import { PronunciationService } from "../pronunciation/pronunciation.service";
import { TranslationsService } from "../translations/translations.service";
import { WordsService } from "../words/words.service";

import { LexemesService } from "./lexemes.service";

import type { WiktionaryPage } from "../lexico-ingestion/lexico-ingestion.types";

describe("LexemesService", () => {
  let service: LexemesService;
  let lexemesService: LexemesService;

  const queryBuilder = {
    getCount: vi.fn(),
    getMany: vi.fn(),
    leftJoinAndSelect: vi.fn(),
    where: vi.fn(),
  };
  queryBuilder.leftJoinAndSelect.mockImplementation(() => queryBuilder);
  queryBuilder.where.mockImplementation(() => queryBuilder);

  const lexemeRepository = {
    createQueryBuilder: vi.fn(() => queryBuilder),
    findOne: vi.fn(),
    save: vi.fn(),
    upsert: vi.fn(),
  };

  const loggerService = {
    debug: vi.fn(),
    error: vi.fn(),
    log: vi.fn(),
    setContext: vi.fn(),
    verbose: vi.fn(),
    warn: vi.fn(),
  };

  const etymologyService = {
    parse: vi.fn<
      () => { etymology: null; participleTranslation: null | Translation }
    >(() => ({ etymology: null, participleTranslation: null })),
  };

  const formsService = {
    buildFormsForPartOfSpeech: vi.fn(() => []),
    ingestLexemeForms: vi.fn(async () => {}),
  };

  const partOfSpeechService = {
    getFirstPrincipalPartName: vi.fn(() => "first"),
    getPartOfSpeech: vi.fn(() => "noun"),
    ingestInflection: vi.fn(() => null),
    parseForms: vi.fn(() => ({})),
  };

  const principalPartsService = {
    ingestLexemePrincipalParts: vi.fn(async () => {}),
    parsePrincipalParts: vi.fn(() => ({
      macronizedWord: "amo",
      principalParts: [],
    })),
  };

  const pronunciationService = {
    ingestLexemePronunciations: vi.fn(async () => {}),
    parse: vi.fn(() => []),
  };

  const translationsService = {
    parseTranslations: vi.fn<() => Translation[]>(() => []),
    prepareTranslationsForSave: vi.fn(
      (_savedLexeme, translations) => translations,
    ),
  };

  const wordsService = {
    ingestLexemeWords: vi.fn(async () => {}),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        LexemesService,
        { provide: getRepositoryToken(Lexeme), useValue: lexemeRepository },
        { provide: EtymologyService, useValue: etymologyService },
        { provide: FormsService, useValue: formsService },
        { provide: PartOfSpeechService, useValue: partOfSpeechService },
        {
          provide: PrincipalPartsService,
          useValue: principalPartsService,
        },
        {
          provide: PronunciationService,
          useValue: pronunciationService,
        },
        { provide: TranslationsService, useValue: translationsService },
        { provide: WordsService, useValue: wordsService },
        { provide: LoggerService, useValue: loggerService },
      ],
    }).compile();

    service = await module.resolve(LexemesService);
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        LexemesService,
        { provide: getRepositoryToken(Lexeme), useValue: lexemeRepository },
        { provide: EtymologyService, useValue: etymologyService },
        { provide: FormsService, useValue: formsService },
        { provide: PartOfSpeechService, useValue: partOfSpeechService },
        { provide: PrincipalPartsService, useValue: principalPartsService },
        { provide: PronunciationService, useValue: pronunciationService },
        { provide: TranslationsService, useValue: translationsService },
        { provide: WordsService, useValue: wordsService },
        { provide: LoggerService, useValue: loggerService },
      ],
    }).compile();

    lexemesService = await moduleRef.resolve(LexemesService);
  });

  it("is defined", () => {
    expect(service).toBeDefined();
    expect(loggerService.setContext).toHaveBeenCalledWith("LexemesService");
  });

  it("should return true from existsByLemma when count is positive", async () => {
    queryBuilder.getCount.mockResolvedValue(1);

    const exists = await lexemesService.existsByLemma("amo");

    expect(exists).toBe(true);
  });

  it("should return false from existsByLemma when count is zero", async () => {
    queryBuilder.getCount.mockResolvedValue(0);

    const exists = await lexemesService.existsByLemma("amo");

    expect(exists).toBe(false);
  });

  it("should fetch saved lexeme by lemma and disambiguator", async () => {
    const lexeme = new Lexeme();
    lexemeRepository.findOne.mockResolvedValue(lexeme);

    const result = await lexemesService.fetchSavedLexeme("amo", 0);

    expect(result).toBe(lexeme);
    expect(lexemeRepository.findOne).toHaveBeenCalledTimes(1);
  });

  it("should find lexemes with translations by lemma", async () => {
    const lexeme = new Lexeme();
    queryBuilder.getMany.mockResolvedValue([lexeme]);

    const result =
      await lexemesService.findLexemesByLemmaWithTranslations("amo");

    expect(result).toEqual([lexeme]);
    expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith(
      "lexeme.translations",
      "translations",
    );
  });

  it("should return empty parse result when html is missing", async () => {
    const result = await lexemesService.parseLexemes({
      category: "lemma",
      href: "x",
      word: "amo",
    });

    expect(result).toEqual([]);
  });

  it("should return empty parse result when no headwords are present", async () => {
    const page: WiktionaryPage = {
      category: "lemma",
      href: "x",
      html: "<div><p>no headword</p></div>",
      word: "amo",
    };

    const result = await lexemesService.parseLexemes(page);

    expect(result).toEqual([]);
    expect(loggerService.warn).toHaveBeenCalledWith(
      "No headwords found for: amo",
    );
  });

  it("should parse lexemes from headword elements", async () => {
    const page: WiktionaryPage = {
      category: "lemma",
      href: "x",
      html: "<p><strong class='Latn headword'>amo</strong></p>",
      word: "amo",
    };

    const parsedLexeme = new Lexeme();
    const parseLexemeFromElementSpy = vi
      .spyOn(
        lexemesService as unknown as {
          parseLexemeFromElement: (args: {
            $: cheerio.CheerioAPI;
            elt: unknown;
            index: number;
            word: string;
          }) => Promise<Lexeme | null>;
        },
        "parseLexemeFromElement",
      )
      .mockResolvedValue(parsedLexeme);

    const result = await lexemesService.parseLexemes(page);

    expect(result).toEqual([parsedLexeme]);
    expect(parseLexemeFromElementSpy).toHaveBeenCalledTimes(1);
  });

  it("should skip null lexemes from parseLexemeFromElement", async () => {
    const page: WiktionaryPage = {
      category: "lemma",
      href: "x",
      html: "<p><strong class='Latn headword'>amo</strong></p>",
      word: "amo",
    };

    vi.spyOn(
      lexemesService as unknown as {
        parseLexemeFromElement: (args: {
          $: cheerio.CheerioAPI;
          elt: unknown;
          index: number;
          word: string;
        }) => Promise<Lexeme | null>;
      },
      "parseLexemeFromElement",
    ).mockResolvedValue(null);

    const result = await lexemesService.parseLexemes(page);

    expect(result).toEqual([]);
  });

  it("should upsert lexeme with ingestion metadata", async () => {
    const lexeme = new Lexeme();
    lexeme.lemma = "amo";
    lexeme.disambiguator = 0;

    await lexemesService.upsertLexeme(lexeme);

    expect(lexeme.createdBy).toBeDefined();
    expect(lexeme.updatedBy).toBeDefined();
    expect(lexemeRepository.upsert).toHaveBeenCalledTimes(1);
  });

  it("should return null from saveParsedLexeme when reload fails", async () => {
    const lexeme = new Lexeme();
    lexeme.lemma = "amo";
    lexeme.disambiguator = 0;

    vi.spyOn(lexemesService, "upsertLexeme").mockResolvedValue(undefined);
    vi.spyOn(lexemesService, "fetchSavedLexeme").mockResolvedValue(null);

    const result = await lexemesService.saveParsedLexeme(lexeme);

    expect(result).toBeNull();
  });

  it("should save relations and return saved lexeme when reload succeeds", async () => {
    const lexeme = new Lexeme();
    lexeme.lemma = "amo";
    lexeme.disambiguator = 0;
    lexeme.forms = [];
    lexeme.principalParts = [];
    lexeme.translations = [];
    lexeme.pronunciations = [];

    const savedLexeme = new Lexeme();
    savedLexeme.lemma = "amo";
    savedLexeme.disambiguator = 0;

    vi.spyOn(lexemesService, "upsertLexeme").mockResolvedValue(undefined);
    vi.spyOn(lexemesService, "fetchSavedLexeme").mockResolvedValue(savedLexeme);

    const saveLexemeRelationsSpy = vi
      .spyOn(
        lexemesService as unknown as {
          saveLexemeRelations: (
            lexemeToSave: Lexeme,
            saved: Lexeme,
          ) => Promise<void>;
        },
        "saveLexemeRelations",
      )
      .mockResolvedValue(undefined);

    const result = await lexemesService.saveParsedLexeme(lexeme);

    expect(result).toBe(savedLexeme);
    expect(saveLexemeRelationsSpy).toHaveBeenCalledWith(lexeme, savedLexeme);
  });

  it("should parse lexeme element and return null for invalid part of speech", async () => {
    partOfSpeechService.getPartOfSpeech.mockReturnValue("invalid-pos");

    const $ = cheerio.load("<p><strong class='Latn headword'>amo</strong></p>");
    const element = $("p").toArray()[0];
    if (!element) {
      throw new Error("Missing element for invalid-pos test");
    }

    const result = await (
      lexemesService as unknown as {
        parseLexemeFromElement: (args: {
          $: cheerio.CheerioAPI;
          elt: unknown;
          index: number;
          word: string;
        }) => Promise<Lexeme | null>;
      }
    ).parseLexemeFromElement({
      $,
      elt: element,
      index: 0,
      word: "amo",
    });

    expect(result).toBeNull();
    expect(loggerService.debug).toHaveBeenCalledWith(
      'Skipping POS "invalid-pos" for: amo',
    );
  });

  it("should parse lexeme element and skip known skip POS without debug log", async () => {
    partOfSpeechService.getPartOfSpeech.mockReturnValue("letter");

    const $ = cheerio.load("<p><strong class='Latn headword'>amo</strong></p>");
    const element = $("p").toArray()[0];
    if (!element) {
      throw new Error("Missing element for skip-pos test");
    }

    const result = await (
      lexemesService as unknown as {
        parseLexemeFromElement: (args: {
          $: cheerio.CheerioAPI;
          elt: unknown;
          index: number;
          word: string;
        }) => Promise<Lexeme | null>;
      }
    ).parseLexemeFromElement({
      $,
      elt: element,
      index: 0,
      word: "amo",
    });

    expect(result).toBeNull();
    expect(loggerService.debug).not.toHaveBeenCalledWith(
      expect.stringContaining("Skipping POS"),
    );
  });

  it("should parse lexeme element when principal part name is empty", async () => {
    partOfSpeechService.getPartOfSpeech.mockReturnValue("noun");
    partOfSpeechService.getFirstPrincipalPartName.mockReturnValue("");

    const $ = cheerio.load("<p><strong class='Latn headword'>amo</strong></p>");
    const element = $("p").toArray()[0];
    if (!element) {
      throw new Error("Missing element for principal-part test");
    }

    const result = await (
      lexemesService as unknown as {
        parseLexemeFromElement: (args: {
          $: cheerio.CheerioAPI;
          elt: unknown;
          index: number;
          word: string;
        }) => Promise<Lexeme | null>;
      }
    ).parseLexemeFromElement({
      $,
      elt: element,
      index: 0,
      word: "amo",
    });

    expect(result).not.toBeNull();
  });

  it("should parse lexeme element and return null when enrichment throws", async () => {
    partOfSpeechService.getPartOfSpeech.mockReturnValue("noun");
    partOfSpeechService.getFirstPrincipalPartName.mockReturnValue("first");

    vi.spyOn(
      lexemesService as unknown as {
        enrichLexeme: (args: {
          $: cheerio.CheerioAPI;
          elt: unknown;
          firstPrincipalPartName: string;
          lexeme: Lexeme;
          partOfSpeech: "noun";
        }) => Promise<void>;
      },
      "enrichLexeme",
    ).mockRejectedValue(new Error("parse failure"));

    const $ = cheerio.load("<p><strong class='Latn headword'>amo</strong></p>");
    const element = $("p").toArray()[0];
    if (!element) {
      throw new Error("Missing element for enrichment failure test");
    }

    const result = await (
      lexemesService as unknown as {
        parseLexemeFromElement: (args: {
          $: cheerio.CheerioAPI;
          elt: unknown;
          index: number;
          word: string;
        }) => Promise<Lexeme | null>;
      }
    ).parseLexemeFromElement({
      $,
      elt: element,
      index: 0,
      word: "amo",
    });

    expect(result).toBeNull();
    expect(loggerService.warn).toHaveBeenCalledTimes(1);
  });

  it("should save inflection relation when inflection exists", async () => {
    const lexeme = new Lexeme();
    const savedLexeme = new Lexeme();

    const inflection = {
      id: "",
      lexeme: undefined,
      save: vi.fn().mockResolvedValue(undefined),
    } as unknown as NonNullable<Lexeme["inflection"]>;

    const savedInflection = {
      id: "existing-id",
    } as NonNullable<Lexeme["inflection"]>;

    lexeme.inflection = inflection;
    savedLexeme.inflection = savedInflection;

    await (
      lexemesService as unknown as {
        saveInflection: (
          inputLexeme: Lexeme,
          inputSavedLexeme: Lexeme,
        ) => Promise<void>;
      }
    ).saveInflection(lexeme, savedLexeme);

    expect(inflection.id).toBe("existing-id");
    expect(
      (inflection.save as ReturnType<typeof vi.fn>).mock.calls.length,
    ).toBe(1);
  });

  it("should return early from saveInflection when no inflection exists", async () => {
    const lexeme = new Lexeme();
    lexeme.inflection = null;

    const savedLexeme = new Lexeme();

    await (
      lexemesService as unknown as {
        saveInflection: (
          inputLexeme: Lexeme,
          inputSavedLexeme: Lexeme,
        ) => Promise<void>;
      }
    ).saveInflection(lexeme, savedLexeme);

    expect(savedLexeme.inflection).toBeUndefined();
  });

  it("should save prepared translations when translations are available", async () => {
    const lexeme = new Lexeme();
    const savedLexeme = new Lexeme();
    lexeme.translations = [];

    const prepareTranslationsForSaveSpy = vi
      .spyOn(translationsService, "prepareTranslationsForSave")
      .mockReturnValue([]);

    await (
      lexemesService as unknown as {
        saveTranslations: (
          inputLexeme: Lexeme,
          inputSavedLexeme: Lexeme,
        ) => Promise<void>;
      }
    ).saveTranslations(lexeme, savedLexeme);

    expect(prepareTranslationsForSaveSpy).toHaveBeenCalledWith(savedLexeme, []);
    expect(lexemeRepository.save).toHaveBeenCalledWith(savedLexeme);
  });

  it("should skip saving translations when translations are null", async () => {
    const lexeme = new Lexeme();
    const savedLexeme = new Lexeme();
    lexeme.translations = null;

    await (
      lexemesService as unknown as {
        saveTranslations: (
          inputLexeme: Lexeme,
          inputSavedLexeme: Lexeme,
        ) => Promise<void>;
      }
    ).saveTranslations(lexeme, savedLexeme);

    expect(
      translationsService.prepareTranslationsForSave,
    ).not.toHaveBeenCalled();
    expect(lexemeRepository.save).not.toHaveBeenCalled();
  });

  it("should ingest forms and words when saving lexeme relations", async () => {
    const lexeme = new Lexeme();
    lexeme.forms = [
      {
        form: "amo",
      },
    ] as unknown as Lexeme["forms"];
    lexeme.principalParts = [];
    lexeme.translations = [];
    lexeme.pronunciations = null;
    lexeme.inflection = null;

    const savedLexeme = new Lexeme();
    savedLexeme.lemma = "amo";
    savedLexeme.disambiguator = 0;

    await (
      lexemesService as unknown as {
        saveLexemeRelations: (
          inputLexeme: Lexeme,
          inputSavedLexeme: Lexeme,
        ) => Promise<void>;
      }
    ).saveLexemeRelations(lexeme, savedLexeme);

    expect(principalPartsService.ingestLexemePrincipalParts).toHaveBeenCalled();
    expect(formsService.ingestLexemeForms).toHaveBeenCalledWith(
      lexeme.forms,
      savedLexeme,
    );
    expect(wordsService.ingestLexemeWords).toHaveBeenCalledWith(savedLexeme);
  });

  it("should ingest pronunciations and skip forms ingestion when no forms exist", async () => {
    const lexeme = new Lexeme();
    lexeme.forms = [];
    lexeme.principalParts = [];
    lexeme.translations = [];
    lexeme.pronunciations = [];
    lexeme.inflection = null;

    const savedLexeme = new Lexeme();
    savedLexeme.lemma = "amo";
    savedLexeme.disambiguator = 0;

    await (
      lexemesService as unknown as {
        saveLexemeRelations: (
          inputLexeme: Lexeme,
          inputSavedLexeme: Lexeme,
        ) => Promise<void>;
      }
    ).saveLexemeRelations(lexeme, savedLexeme);

    expect(
      pronunciationService.ingestLexemePronunciations,
    ).toHaveBeenCalledWith(savedLexeme, []);
    expect(formsService.ingestLexemeForms).not.toHaveBeenCalled();
  });

  it("should merge participle translation into parsed translations during enrichment", async () => {
    const lexeme = new Lexeme();
    lexeme.lemma = "amo";
    lexeme.disambiguator = 0;

    const primaryTranslation = new Translation("To love");
    const participleTranslation = new Translation("Loving");

    principalPartsService.parsePrincipalParts.mockReturnValue({
      macronizedWord: "amō",
      principalParts: [],
    });
    partOfSpeechService.ingestInflection.mockReturnValue(null);
    translationsService.parseTranslations.mockReturnValue([primaryTranslation]);
    etymologyService.parse.mockReturnValue({
      etymology: null,
      participleTranslation,
    });
    pronunciationService.parse.mockReturnValue([]);
    partOfSpeechService.parseForms.mockResolvedValue({});
    formsService.buildFormsForPartOfSpeech.mockReturnValue([]);

    const $ = cheerio.load("<p><strong class='Latn headword'>amo</strong></p>");
    const element = $("p").toArray()[0];
    if (!element) {
      throw new Error("Missing element for enrich merge test");
    }

    await (
      lexemesService as unknown as {
        enrichLexeme: (args: {
          $: cheerio.CheerioAPI;
          elt: unknown;
          firstPrincipalPartName: string;
          lexeme: Lexeme;
          partOfSpeech: "verb";
        }) => Promise<void>;
      }
    ).enrichLexeme({
      $,
      elt: element,
      firstPrincipalPartName: "amo",
      lexeme,
      partOfSpeech: "verb",
    });

    expect(lexeme.translations).toEqual([
      primaryTranslation,
      participleTranslation,
    ]);
  });

  it("should parse lexeme element successfully when enrichment succeeds", async () => {
    partOfSpeechService.getPartOfSpeech.mockReturnValue("noun");
    partOfSpeechService.getFirstPrincipalPartName.mockReturnValue("first");

    vi.spyOn(
      lexemesService as unknown as {
        enrichLexeme: (args: {
          $: cheerio.CheerioAPI;
          elt: unknown;
          firstPrincipalPartName: string;
          lexeme: Lexeme;
          partOfSpeech: "noun";
        }) => Promise<void>;
      },
      "enrichLexeme",
    ).mockResolvedValue(undefined);

    const $ = cheerio.load("<p><strong class='Latn headword'>amo</strong></p>");
    const element = $("p").toArray()[0];
    if (!element) {
      throw new Error("Missing element for lexeme parse test");
    }

    const result = await (
      lexemesService as unknown as {
        parseLexemeFromElement: (args: {
          $: cheerio.CheerioAPI;
          elt: unknown;
          index: number;
          word: string;
        }) => Promise<Lexeme | null>;
      }
    ).parseLexemeFromElement({
      $,
      elt: element,
      index: 2,
      word: "Amō",
    });

    expect(result?.lemma).toBe("amo");
    expect(result?.disambiguator).toBe(2);
    expect(result?.partOfSpeech).toBe("noun");
  });
});
