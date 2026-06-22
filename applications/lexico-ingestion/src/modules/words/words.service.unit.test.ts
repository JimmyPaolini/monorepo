/* cspell:ignore amāvī amāre */
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  type Form,
  Lexeme,
  PrincipalPart,
  Word,
  WordForm,
  WordLexeme,
} from "@monorepo/lexico-entities";

import { LEXICO_INGESTION_BY_ID } from "../lexico-ingestion/lexico-ingestion.constants";

import { WordsService } from "./words.service";

describe(WordsService, () => {
  interface MockQueryBuilder {
    execute: ReturnType<typeof vi.fn<() => Promise<void>>>;
    insert: ReturnType<typeof vi.fn<() => MockQueryBuilder>>;
    into: ReturnType<typeof vi.fn<() => MockQueryBuilder>>;
    orIgnore: ReturnType<typeof vi.fn<() => MockQueryBuilder>>;
    values: ReturnType<typeof vi.fn<() => MockQueryBuilder>>;
  }

  interface WordRepositoryMock {
    createQueryBuilder: ReturnType<typeof vi.fn<() => MockQueryBuilder>>;
    find: ReturnType<typeof vi.fn<() => Promise<Word[]>>>;
    upsert: ReturnType<
      typeof vi.fn<
        (entity: unknown, conflictOptions: unknown) => Promise<unknown>
      >
    >;
  }

  interface WordJunctionRepositoryMock {
    createQueryBuilder: ReturnType<typeof vi.fn<() => MockQueryBuilder>>;
  }

  let service: WordsService;
  let wordRepository: WordRepositoryMock;
  let wordLexemeRepository: WordJunctionRepositoryMock;
  let wordFormRepository: WordJunctionRepositoryMock;

  beforeAll(async () => {
    const createMockQueryBuilder = (): MockQueryBuilder => {
      const self: MockQueryBuilder = {
        execute: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
        insert: vi.fn<() => MockQueryBuilder>(() => self),
        into: vi.fn<() => MockQueryBuilder>(() => self),
        orIgnore: vi.fn<() => MockQueryBuilder>(() => self),
        values: vi.fn<() => MockQueryBuilder>(() => self),
      };
      return self;
    };

    const mockWordRepository = {
      createQueryBuilder: vi.fn<() => MockQueryBuilder>(() =>
        createMockQueryBuilder(),
      ),
      find: vi.fn<() => Promise<Word[]>>(),
      upsert:
        vi.fn<
          (entity: unknown, conflictOptions: unknown) => Promise<unknown>
        >(),
    };

    const mockWordLexemeRepository = {
      createQueryBuilder: vi.fn<() => MockQueryBuilder>(() =>
        createMockQueryBuilder(),
      ),
    };

    const mockWordFormRepository = {
      createQueryBuilder: vi.fn<() => MockQueryBuilder>(() =>
        createMockQueryBuilder(),
      ),
    };

    const module = await Test.createTestingModule({
      providers: [
        WordsService,
        { provide: getRepositoryToken(Word), useValue: mockWordRepository },
        {
          provide: getRepositoryToken(WordLexeme),
          useValue: mockWordLexemeRepository,
        },
        {
          provide: getRepositoryToken(WordForm),
          useValue: mockWordFormRepository,
        },
      ],
    }).compile();

    service = await module.resolve(WordsService);
    wordRepository = await module.resolve<WordRepositoryMock>(
      getRepositoryToken(Word),
    );
    wordLexemeRepository = await module.resolve<WordJunctionRepositoryMock>(
      getRepositoryToken(WordLexeme),
    );
    wordFormRepository = await module.resolve<WordJunctionRepositoryMock>(
      getRepositoryToken(WordForm),
    );
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is defined", () => {
    expect(service).toBeDefined();
  });

  describe("getLexemeWords", () => {
    it("should return text from all principal parts", () => {
      const pp1 = new PrincipalPart();
      pp1.text = ["amo"];
      const pp2 = new PrincipalPart();
      pp2.text = ["amare"];
      const pp3 = new PrincipalPart();
      pp3.text = ["amavi"];

      const lexeme = new Lexeme();
      lexeme.principalParts = [pp1, pp2, pp3];

      const result = service.getLexemeWords(lexeme);

      expect(result).toStrictEqual(["amo", "amare", "amavi"]);
    });

    it("should return empty array when no principal parts", () => {
      const lexeme = new Lexeme();
      lexeme.principalParts = [];

      const result = service.getLexemeWords(lexeme);

      expect(result).toStrictEqual([]);
    });

    it("should flatten multiple text entries from principal parts", () => {
      const pp1 = new PrincipalPart();
      pp1.text = ["amo", "amō"];
      const pp2 = new PrincipalPart();
      pp2.text = ["amare", "amāre"];

      const lexeme = new Lexeme();
      lexeme.principalParts = [pp1, pp2];

      const result = service.getLexemeWords(lexeme);

      expect(result).toStrictEqual(["amo", "amō", "amare", "amāre"]);
    });
  });

  describe("ingestLexemeWords", () => {
    it("should upsert normalized words for lexeme principal parts", async () => {
      const pp1 = new PrincipalPart();
      pp1.text = ["amo"];
      const pp2 = new PrincipalPart();
      pp2.text = ["amare"];

      const lexeme = new Lexeme();
      lexeme.id = "amor:1";
      lexeme.principalParts = [pp1, pp2];

      const word1 = new Word();
      word1.id = "1";
      word1.data = "amo";

      const word2 = new Word();
      word2.id = "2";
      word2.data = "amare";

      wordRepository.upsert.mockResolvedValue({});
      wordRepository.find.mockResolvedValue([word1, word2]);

      await service.ingestLexemeWords(lexeme);

      expect(wordRepository.upsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ data: "amo" }),
          expect.objectContaining({ data: "amare" }),
        ]),
        {
          conflictPaths: ["data"],
          skipUpdateIfNoValuesChanged: true,
        },
      );
    });

    it("should normalize words before upsert", async () => {
      const pp1 = new PrincipalPart();
      pp1.text = ["Amo"];
      const pp2 = new PrincipalPart();
      pp2.text = ["amāre"];

      const lexeme = new Lexeme();
      lexeme.id = "amor:1";
      lexeme.principalParts = [pp1, pp2];

      const word = new Word();
      word.id = "1";
      word.data = "amo";

      wordRepository.upsert.mockResolvedValue({});
      wordRepository.find.mockResolvedValue([word]);

      await service.ingestLexemeWords(lexeme);

      expect(wordRepository.upsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ data: "amo" }),
          expect.objectContaining({ data: "amare" }),
        ]),
        expect.anything(),
      );
    });

    it("should create WordLexeme junctions for ingested words", async () => {
      const pp1 = new PrincipalPart();
      pp1.text = ["rosa"];

      const lexeme = new Lexeme();
      lexeme.id = "rosa:1";
      lexeme.principalParts = [pp1];

      const word = new Word();
      word.id = "1";
      word.data = "rosa";

      wordRepository.upsert.mockResolvedValue({});
      wordRepository.find.mockResolvedValue([word]);

      await service.ingestLexemeWords(lexeme);

      expect(wordLexemeRepository.createQueryBuilder).toHaveBeenCalledWith();
    });

    it("should escape capital letters during normalization", async () => {
      const pp1 = new PrincipalPart();
      pp1.text = ["Julius"];

      const lexeme = new Lexeme();
      lexeme.id = "julius:1";
      lexeme.principalParts = [pp1];

      const word = new Word();
      word.id = "1";
      word.data = "_julius";

      wordRepository.upsert.mockResolvedValue({});
      wordRepository.find.mockResolvedValue([word]);

      await service.ingestLexemeWords(lexeme);

      expect(wordRepository.upsert).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ data: "julius" })]),
        expect.anything(),
      );
    });

    it("should skip when no words provided", async () => {
      const lexeme = new Lexeme();
      lexeme.principalParts = [];

      await service.ingestLexemeWords(lexeme);

      expect(wordRepository.upsert).not.toHaveBeenCalled();
    });
  });

  describe("upsertWordsAndJunctions", () => {
    it("should upsert words with metadata fields", async () => {
      const formsByWord = new Map<string, Set<Form>>([["amo", new Set()]]);
      const lexeme = new Lexeme();
      lexeme.id = "amor:1";

      wordRepository.upsert.mockResolvedValue({});
      wordRepository.find.mockResolvedValue([]);

      await service.upsertWordsAndJunctions(formsByWord, lexeme);

      expect(wordRepository.upsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            createdBy: LEXICO_INGESTION_BY_ID,
            data: "amo",
            updatedBy: LEXICO_INGESTION_BY_ID,
          }),
        ]),
        {
          conflictPaths: ["data"],
          skipUpdateIfNoValuesChanged: true,
        },
      );
    });

    it("should skip when no words provided", async () => {
      const formsByWord = new Map<string, Set<Form>>();
      const lexeme = new Lexeme();

      await service.upsertWordsAndJunctions(formsByWord, lexeme);

      expect(wordRepository.upsert).not.toHaveBeenCalled();
    });

    it("should create WordLexeme and WordForm junctions", async () => {
      const form1 = {
        id: "form1",
        lexeme: new Lexeme(),
        wordForms: [],
      } as unknown as Form;
      const formsByWord = new Map<string, Set<Form>>([
        ["rosa", new Set<Form>([form1])],
      ]);
      const lexeme = new Lexeme();
      lexeme.id = "rosa:1";

      const word = new Word();
      word.id = "1";
      word.data = "rosa";

      wordRepository.upsert.mockResolvedValue({});
      wordRepository.find.mockResolvedValue([word]);

      await service.upsertWordsAndJunctions(formsByWord, lexeme);

      expect(wordLexemeRepository.createQueryBuilder).toHaveBeenCalledWith();
    });

    it("should link form to word via WordForm junction", async () => {
      const form1 = {
        id: "form1",
        lexeme: new Lexeme(),
        wordForms: [],
      } as unknown as Form;
      const formsByWord = new Map<string, Set<Form>>([
        ["rosa", new Set<Form>([form1])],
      ]);
      const lexeme = new Lexeme();
      lexeme.id = "rosa:1";

      const word = new Word();
      word.id = "1";
      word.data = "rosa";

      wordRepository.upsert.mockResolvedValue({});
      wordRepository.find.mockResolvedValue([word]);

      await service.upsertWordsAndJunctions(formsByWord, lexeme);

      expect(wordFormRepository.createQueryBuilder).toHaveBeenCalledWith();
    });

    it("should batch large sets of word forms", async () => {
      const forms: Form[] = [];
      for (let index = 0; index < 1500; index += 1) {
        forms.push({
          id: `form${index}`,
          lexeme: new Lexeme(),
          wordForms: [],
        } as unknown as Form);
      }

      const formsByWord = new Map<string, Set<Form>>([
        ["rosa", new Set<Form>(forms)],
      ]);
      const lexeme = new Lexeme();
      lexeme.id = "rosa:1";

      const word = new Word();
      word.id = "1";
      word.data = "rosa";

      wordRepository.upsert.mockResolvedValue({});
      wordRepository.find.mockResolvedValue([word]);

      await service.upsertWordsAndJunctions(formsByWord, lexeme);

      // Should call createQueryBuilder multiple times due to batching
      expect(
        wordFormRepository.createQueryBuilder.mock.calls.length,
      ).toBeGreaterThan(1);
    });
  });
});
