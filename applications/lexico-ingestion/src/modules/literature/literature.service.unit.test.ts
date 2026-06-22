import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { Author, Line, Text, Token, Word } from "@monorepo/lexico-entities";

import { LoggerService } from "../logger/logger.service";
import { NumeralsService } from "../numerals/numerals.service";

import { LiteratureLibraryScanService } from "./literature-library-scan.service";
import { LiteratureTextIngestionService } from "./literature-text-ingestion.service";
import { LiteratureService } from "./literature.service";

import type { IngestTextArguments, LibraryEntry } from "./literature.types";

// cspell:ignore arma cano proemium virumque

const { existsSyncMock, mkdirSyncMock, readFileMock } = vi.hoisted(() => ({
  existsSyncMock: vi.fn<() => boolean>(),
  mkdirSyncMock: vi.fn<(...parameters: unknown[]) => void>(),
  readFileMock: vi.fn<() => Promise<string>>(),
}));
const { existsSync, mkdirSync } = vi.hoisted(() => ({
  existsSync: existsSyncMock,
  mkdirSync: mkdirSyncMock,
}));

vi.mock("node:fs", () => ({
  existsSync,
  mkdirSync,
}));

vi.mock("node:fs/promises", () => ({
  readFile: readFileMock,
}));

describe(LiteratureService, () => {
  let service: LiteratureService;

  const authorRepository = {
    findOneOrFail: vi.fn<() => Promise<Author | undefined>>(),
    save: vi.fn<(entity: Author) => Promise<Author>>(),
    upsert:
      vi.fn<(entity: unknown, conflictOptions: unknown) => Promise<unknown>>(),
  };

  const lineRepository = {
    find: vi.fn<() => Promise<Line[]>>(),
    upsert:
      vi.fn<(entity: unknown, conflictOptions: unknown) => Promise<unknown>>(),
  };

  const textRepository = {
    findOneOrFail: vi.fn<() => Promise<Text>>(),
    upsert:
      vi.fn<(entity: unknown, conflictOptions: unknown) => Promise<unknown>>(),
  };

  const tokenRepository = {
    upsert:
      vi.fn<(entity: unknown, conflictOptions: unknown) => Promise<unknown>>(),
  };

  const wordRepository = {
    find: vi.fn<() => Promise<Word[]>>(),
  };

  const loggerService = {
    log: vi.fn<(...parameters: unknown[]) => void>(),
    setContext: vi.fn<(context: string) => void>(),
    warn: vi.fn<(...parameters: unknown[]) => void>(),
  };

  const numeralsService = {
    toDecimal: vi.fn<(roman: string) => number>(),
  };

  const literatureLibraryScanService = {
    scanLibrary: vi.fn<() => Promise<LibraryEntry[]>>(),
  };

  const literatureTextIngestionService = {
    ingestTextWithLogging: vi.fn<
      (
        dependencies: {
          ingestText: (args: IngestTextArguments) => Promise<void>;
        },
        argumentsObject: {
          authorEntity: IngestTextArguments["author"];
          authorSlug: string;
          currentText: number;
          logFilePath: string;
          parentTexts: Map<string, Text>;
          textEntry: LibraryEntry;
          totalTexts: number;
        },
      ) => Promise<void>
    >(),
  };

  let literatureService: LiteratureService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        LiteratureService,
        {
          provide: getRepositoryToken(Author),
          useValue: {
            findOneOrFail: vi.fn<(...parameters: unknown[]) => unknown>(),
            save: vi.fn<(...parameters: unknown[]) => unknown>(),
            upsert: vi.fn<(...parameters: unknown[]) => unknown>(),
          },
        },
        {
          provide: getRepositoryToken(Line),
          useValue: {
            find: vi.fn<(...parameters: unknown[]) => unknown>(),
            upsert: vi.fn<(...parameters: unknown[]) => unknown>(),
          },
        },
        {
          provide: NumeralsService,
          useValue: {
            toDecimal: vi.fn<(...parameters: unknown[]) => unknown>(),
          },
        },
        {
          provide: getRepositoryToken(Text),
          useValue: {
            findOneOrFail: vi.fn<(...parameters: unknown[]) => unknown>(),
            upsert: vi.fn<(...parameters: unknown[]) => unknown>(),
          },
        },
        {
          provide: getRepositoryToken(Token),
          useValue: { upsert: vi.fn<(...parameters: unknown[]) => unknown>() },
        },
        {
          provide: getRepositoryToken(Word),
          useValue: { find: vi.fn<(...parameters: unknown[]) => unknown>() },
        },
        {
          provide: LiteratureLibraryScanService,
          useValue: {
            scanLibrary: vi.fn<(...parameters: unknown[]) => unknown>(),
          },
        },
        {
          provide: LiteratureTextIngestionService,
          useValue: {
            ingestTextWithLogging:
              vi.fn<(...parameters: unknown[]) => unknown>(),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: vi.fn<(...parameters: unknown[]) => unknown>(),
            setContext: vi.fn<(...parameters: unknown[]) => unknown>(),
            warn: vi.fn<(...parameters: unknown[]) => unknown>(),
          },
        },
      ],
    }).compile();

    service = await module.resolve(LiteratureService);
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    existsSyncMock.mockReturnValue(true);

    authorRepository.findOneOrFail.mockResolvedValue({
      id: "author-id",
      slug: "vergil",
    } as unknown as Author);
    authorRepository.save.mockResolvedValue({
      id: "author-id",
      slug: "vergil",
    } as unknown as Author);
    authorRepository.upsert.mockResolvedValue(undefined);

    lineRepository.find.mockResolvedValue([]);
    lineRepository.upsert.mockResolvedValue(undefined);

    textRepository.findOneOrFail.mockResolvedValue({
      author: { slug: "vergil" },
      id: "text-id",
      slug: "vergil/aeneid",
      title: "Aeneid",
    } as unknown as Text);
    textRepository.upsert.mockResolvedValue(undefined);

    tokenRepository.upsert.mockResolvedValue(undefined);
    wordRepository.find.mockResolvedValue([]);

    numeralsService.toDecimal.mockReturnValue(4);
    literatureLibraryScanService.scanLibrary.mockResolvedValue([]);
    literatureTextIngestionService.ingestTextWithLogging.mockResolvedValue(
      undefined,
    );

    readFileMock.mockResolvedValue("# heading");

    const moduleRef = await Test.createTestingModule({
      providers: [
        LiteratureService,
        { provide: getRepositoryToken(Author), useValue: authorRepository },
        { provide: getRepositoryToken(Line), useValue: lineRepository },
        { provide: NumeralsService, useValue: numeralsService },
        { provide: getRepositoryToken(Text), useValue: textRepository },
        { provide: getRepositoryToken(Token), useValue: tokenRepository },
        { provide: getRepositoryToken(Word), useValue: wordRepository },
        {
          provide: LiteratureLibraryScanService,
          useValue: literatureLibraryScanService,
        },
        {
          provide: LiteratureTextIngestionService,
          useValue: literatureTextIngestionService,
        },
        { provide: LoggerService, useValue: loggerService },
      ],
    }).compile();

    literatureService = await moduleRef.resolve(LiteratureService);
  });

  it("is defined", () => {
    expect(service).toBeDefined();
  });

  it("should set logger context on construction", () => {
    expect(loggerService.setContext).toHaveBeenCalledWith("LiteratureService");
  });

  it("should create output directory when it does not exist", async () => {
    existsSyncMock.mockReturnValue(false);

    const moduleRef = await Test.createTestingModule({
      providers: [
        LiteratureService,
        { provide: getRepositoryToken(Author), useValue: authorRepository },
        { provide: getRepositoryToken(Line), useValue: lineRepository },
        { provide: NumeralsService, useValue: numeralsService },
        { provide: getRepositoryToken(Text), useValue: textRepository },
        { provide: getRepositoryToken(Token), useValue: tokenRepository },
        { provide: getRepositoryToken(Word), useValue: wordRepository },
        {
          provide: LiteratureLibraryScanService,
          useValue: literatureLibraryScanService,
        },
        {
          provide: LiteratureTextIngestionService,
          useValue: literatureTextIngestionService,
        },
        { provide: LoggerService, useValue: loggerService },
      ],
    }).compile();

    await moduleRef.resolve(LiteratureService);

    expect(mkdirSyncMock).toHaveBeenCalledWith(expect.any(String), {
      recursive: true,
    });
  });

  it("should parse frontmatter and tolerate invalid yaml", () => {
    const parseFrontmatter = (
      literatureService as unknown as {
        parseFrontmatter: (ast: {
          children: { type: string; value?: string }[];
          type: string;
        }) => Record<string, unknown>;
      }
    ).parseFrontmatter.bind(literatureService);

    const parsed = parseFrontmatter({
      children: [
        { type: "yaml", value: "text_metadata:\n  genre: epic" },
        { type: "paragraph" },
      ],
      type: "root",
    });

    const fallback = parseFrontmatter({
      children: [{ type: "yaml", value: "invalid: [" }],
      type: "root",
    });

    expect(parsed).toStrictEqual({ text_metadata: { genre: "epic" } });
    expect(fallback).toStrictEqual({});
  });

  it("should return empty frontmatter when yaml node is missing", () => {
    const parseFrontmatter = (
      literatureService as unknown as {
        parseFrontmatter: (ast: {
          children: { type: string; value?: string }[];
          type: string;
        }) => Record<string, unknown>;
      }
    ).parseFrontmatter.bind(literatureService);

    const parsed = parseFrontmatter({
      children: [{ type: "paragraph" }],
      type: "root",
    });

    expect(parsed).toStrictEqual({});
  });

  it("should return empty frontmatter when yaml parses to null", () => {
    const parseFrontmatter = (
      literatureService as unknown as {
        parseFrontmatter: (ast: {
          children: { type: string; value?: string }[];
          type: string;
        }) => Record<string, unknown>;
      }
    ).parseFrontmatter.bind(literatureService);

    const parsed = parseFrontmatter({
      children: [{ type: "yaml", value: "null" }],
      type: "root",
    });

    expect(parsed).toStrictEqual({});
  });

  it("should parse labels from strong nodes", () => {
    const parseLabelFromStrongNode = (
      literatureService as unknown as {
        parseLabelFromStrongNode: (
          strongNode: {
            children: { type: string; value: string }[];
            type: string;
          },
          lineNodes: { children?: unknown[]; type: string; value?: string }[],
        ) => {
          label: string;
          lineNodes: { children?: unknown[]; type: string; value?: string }[];
        };
      }
    ).parseLabelFromStrongNode.bind(literatureService);

    const standard = parseLabelFromStrongNode(
      {
        children: [{ type: "text", value: "IV. arma" }],
        type: "strong",
      },
      [
        {
          children: [{ type: "text", value: "IV. arma" }],
          type: "strong",
        },
        { type: "text", value: " virumque" },
      ],
    );

    const nonStandard = parseLabelFromStrongNode(
      {
        children: [{ type: "text", value: "proemium" }],
        type: "strong",
      },
      [
        {
          children: [{ type: "text", value: "proemium" }],
          type: "strong",
        },
        { type: "text", value: "  cano" },
      ],
    );

    expect(standard.label).toBe("4");
    expect(nonStandard.label).toBe("proemium");
    expect(nonStandard.lineNodes[0]).toStrictEqual({
      type: "text",
      value: "cano",
    });
  });

  it("should keep oversized non-standard label as line content", () => {
    const parseLabelFromStrongNode = (
      literatureService as unknown as {
        parseLabelFromStrongNode: (
          strongNode: {
            children: { type: string; value: string }[];
            type: string;
          },
          lineNodes: { children?: unknown[]; type: string; value?: string }[],
        ) => {
          label: string;
          lineNodes: { children?: unknown[]; type: string; value?: string }[];
        };
      }
    ).parseLabelFromStrongNode.bind(literatureService);

    const longLabel = "a".repeat(40);
    const parsed = parseLabelFromStrongNode(
      {
        children: [{ type: "text", value: longLabel }],
        type: "strong",
      },
      [
        {
          children: [{ type: "text", value: longLabel }],
          type: "strong",
        },
        { type: "text", value: " tail" },
      ],
    );

    expect(parsed.label).toBe("3");
    expect(parsed.lineNodes[0]).toStrictEqual({
      type: "text",
      value: `${longLabel} `,
    });
  });

  it("should preserve standard label remainder as text", () => {
    const parseLabelFromStrongNode = (
      literatureService as unknown as {
        parseLabelFromStrongNode: (
          strongNode: {
            children: { type: string; value: string }[];
            type: string;
          },
          lineNodes: { children?: unknown[]; type: string; value?: string }[],
        ) => {
          label: string;
          lineNodes: { children?: unknown[]; type: string; value?: string }[];
        };
      }
    ).parseLabelFromStrongNode.bind(literatureService);

    const parsed = parseLabelFromStrongNode(
      {
        children: [{ type: "text", value: "12) remainder" }],
        type: "strong",
      },
      [
        {
          children: [{ type: "text", value: "12) remainder" }],
          type: "strong",
        },
        { type: "text", value: " content" },
      ],
    );

    expect(parsed.label).toBe("12");
    expect(parsed.lineNodes[0]).toStrictEqual({
      type: "text",
      value: ") remainder ",
    });
  });

  it("should parse non-standard roman numeral label", () => {
    const parseLabelFromStrongNode = (
      literatureService as unknown as {
        parseLabelFromStrongNode: (
          strongNode: {
            children: { type: string; value: string }[];
            type: string;
          },
          lineNodes: { children?: unknown[]; type: string; value?: string }[],
        ) => {
          label: string;
          lineNodes: { children?: unknown[]; type: string; value?: string }[];
        };
      }
    ).parseLabelFromStrongNode.bind(literatureService);

    const parsed = parseLabelFromStrongNode(
      {
        children: [{ type: "text", value: "IV" }],
        type: "strong",
      },
      [
        {
          children: [{ type: "text", value: "IV" }],
          type: "strong",
        },
        { type: "text", value: " next" },
      ],
    );

    expect(parsed.label).toBe("4");
    expect(parsed.lineNodes[0]).toStrictEqual({ type: "text", value: " next" });
  });

  it("should parse roman numeral through parseNonStandardLabel", () => {
    const parseNonStandardLabel = (
      literatureService as unknown as {
        parseNonStandardLabel: (
          rawLabel: string,
          lineNodes: { type: string; value?: string }[],
        ) => {
          label: string;
          lineNodes: { type: string; value?: string }[];
        };
      }
    ).parseNonStandardLabel.bind(literatureService);

    const parsed = parseNonStandardLabel("X", [
      { type: "text", value: "X" },
      { type: "text", value: " next" },
    ]);

    expect(parsed.label).toBe("4");
  });

  it("should fallback to empty label when parseStandardLabel receives missing capture", () => {
    const parseStandardLabel = (
      literatureService as unknown as {
        parseStandardLabel: (
          labelMatch: RegExpExecArray,
          lineNodes: { type: string; value?: string }[],
        ) => {
          label: string;
          lineNodes: { type: string; value?: string }[];
        };
      }
    ).parseStandardLabel.bind(literatureService);

    const missingCaptureMatch = [
      "",
      undefined,
      "tail",
    ] as unknown as RegExpExecArray;
    const parsed = parseStandardLabel(missingCaptureMatch, [
      { type: "text", value: "head" },
      { type: "text", value: "content" },
    ]);

    expect(parsed.label).toBe("");
    expect(parsed.lineNodes[0]).toStrictEqual({ type: "text", value: "tail " });
  });

  it("should preserve nodes when next parsed node is not text", () => {
    const parseLabelFromStrongNode = (
      literatureService as unknown as {
        parseLabelFromStrongNode: (
          strongNode: {
            children: { type: string; value: string }[];
            type: string;
          },
          lineNodes: { children?: unknown[]; type: string; value?: string }[],
        ) => {
          label: string;
          lineNodes: { children?: unknown[]; type: string; value?: string }[];
        };
      }
    ).parseLabelFromStrongNode.bind(literatureService);

    const parsed = parseLabelFromStrongNode(
      {
        children: [{ type: "text", value: "proemium" }],
        type: "strong",
      },
      [
        {
          children: [{ type: "text", value: "proemium" }],
          type: "strong",
        },
        {
          children: [{ type: "text", value: "not-text-node" }],
          type: "strong",
        },
      ],
    );

    expect(parsed.label).toBe("proemium");
    expect(parsed.lineNodes[0]).toStrictEqual({
      children: [{ type: "text", value: "not-text-node" }],
      type: "strong",
    });
  });

  it("should build line entity from paragraph nodes", () => {
    const buildLineEntityFromParagraph = (
      literatureService as unknown as {
        buildLineEntityFromParagraph: (
          paragraph: {
            children: { children?: unknown[]; type: string; value?: string }[];
            type: string;
          },
          index: number,
          text: Text,
        ) => { data: string; index: number; label: string; text: Text };
      }
    ).buildLineEntityFromParagraph.bind(literatureService);

    const text = {
      author: { slug: "vergil" },
      id: "text-id",
      slug: "vergil/aeneid",
      title: "Aeneid",
    } as unknown as Text;

    const line = buildLineEntityFromParagraph(
      {
        children: [
          {
            children: [{ type: "text", value: "I. arma" }],
            type: "strong",
          },
          { type: "text", value: " virumque cano" },
        ],
        type: "paragraph",
      },
      0,
      text,
    );

    expect(line.label).toBe("4");
    expect(line.data).toContain("arma");
    expect(line.data).toContain("virumque cano");
    expect(line.index).toBe(0);
  });

  it("should cache dictionary words only once", async () => {
    wordRepository.find.mockResolvedValueOnce([
      { data: "amo", id: "word-1" },
      { data: "cano", id: "word-2" },
    ] as unknown as Word[]);

    const getWordsCache = (
      literatureService as unknown as {
        getWordsCache: () => Promise<Map<string, string>>;
      }
    ).getWordsCache.bind(literatureService);

    const first = await getWordsCache();
    const second = await getWordsCache();

    expect(first.get("amo")).toBe("word-1");
    expect(second.get("cano")).toBe("word-2");
    expect(wordRepository.find).toHaveBeenCalledTimes(1);
  });

  it("should extract tokens and attach mapped word ids", () => {
    const extractTokensFromLine = (
      literatureService as unknown as {
        extractTokensFromLine: (
          line: Line,
          text: Text,
          wordMap: Map<string, string>,
        ) => {
          data: string;
          isPunctuation: boolean;
          word: null | { id: string };
        }[];
      }
    ).extractTokensFromLine.bind(literatureService);

    const text = {
      author: { slug: "vergil" },
      id: "text-id",
      slug: "vergil/aeneid",
      title: "Aeneid",
    } as unknown as Text;

    const line = {
      data: "amo, cano",
      id: "line-id",
      index: 0,
    } as unknown as Line;

    const tokens = extractTokensFromLine(
      line,
      text,
      new Map([
        ["amo", "word-1"],
        ["cano", "word-2"],
      ]),
    );

    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens.some((token) => token.word?.id === "word-1")).toBe(true);
    expect(tokens.some((token) => token.isPunctuation)).toBe(true);
  });

  it("should return an empty token list when line data has no token matches", () => {
    const extractTokensFromLine = (
      literatureService as unknown as {
        extractTokensFromLine: (
          line: Line,
          text: Text,
          wordMap: Map<string, string>,
        ) => {
          data: string;
          isPunctuation: boolean;
          word: null | { id: string };
        }[];
      }
    ).extractTokensFromLine.bind(literatureService);

    const text = {
      author: { slug: "vergil" },
      id: "text-id",
      slug: "vergil/aeneid",
      title: "Aeneid",
    } as unknown as Text;

    const line = {
      data: "",
      id: "line-id",
      index: 0,
    } as unknown as Line;

    const tokens = extractTokensFromLine(line, text, new Map());

    expect(tokens).toStrictEqual([]);
  });

  it("should leave token word null when normalized word is missing from map", () => {
    const extractTokensFromLine = (
      literatureService as unknown as {
        extractTokensFromLine: (
          line: Line,
          text: Text,
          wordMap: Map<string, string>,
        ) => {
          data: string;
          isPunctuation: boolean;
          word: null | { id: string };
        }[];
      }
    ).extractTokensFromLine.bind(literatureService);

    const text = {
      author: { slug: "vergil" },
      id: "text-id",
      slug: "vergil/aeneid",
      title: "Aeneid",
    } as unknown as Text;

    const line = {
      data: "amo",
      id: "line-id",
      index: 0,
    } as unknown as Line;

    const tokens = extractTokensFromLine(line, text, new Map());

    expect(tokens[0]?.word).toBeNull();
  });

  it("should normalize and escape capitals when mapping tokens", () => {
    const extractTokensFromLine = (
      literatureService as unknown as {
        extractTokensFromLine: (
          line: Line,
          text: Text,
          wordMap: Map<string, string>,
        ) => {
          data: string;
          isPunctuation: boolean;
          word: null | { id: string };
        }[];
      }
    ).extractTokensFromLine.bind(literatureService);

    const text = {
      author: { slug: "vergil" },
      id: "text-id",
      slug: "vergil/aeneid",
      title: "Aeneid",
    } as unknown as Text;

    const line = {
      data: "Amo",
      id: "line-id",
      index: 0,
    } as unknown as Line;

    const tokens = extractTokensFromLine(
      line,
      text,
      new Map([["amo", "word-9"]]),
    );

    expect(tokens[0]?.word).toStrictEqual({ id: "word-9" });
  });

  it("should escape capitals using underscore notation", () => {
    const escaped = (
      literatureService as unknown as {
        escapeCapitals: (word: string) => string;
      }
    ).escapeCapitals("Amo");

    expect(escaped).toBe("_amo");
  });

  it("should memoize token lookup results across repeated token extraction", () => {
    const extractTokensFromLine = (
      literatureService as unknown as {
        extractTokensFromLine: (
          line: Line,
          text: Text,
          wordMap: Map<string, string>,
        ) => {
          data: string;
          isPunctuation: boolean;
          word: null | { id: string };
        }[];
      }
    ).extractTokensFromLine.bind(literatureService);

    const text = {
      author: { slug: "vergil" },
      id: "text-id",
      slug: "vergil/aeneid",
      title: "Aeneid",
    } as unknown as Text;

    const wordMap = new Map([["amo", "word-1"]]);

    const firstTokens = extractTokensFromLine(
      { data: "amo", id: "line-1", index: 0 } as unknown as Line,
      text,
      wordMap,
    );

    wordMap.clear();

    const secondTokens = extractTokensFromLine(
      { data: "amo", id: "line-2", index: 1 } as unknown as Line,
      text,
      wordMap,
    );

    expect(firstTokens[0]?.word).toStrictEqual({ id: "word-1" });
    expect(secondTokens[0]?.word).toStrictEqual({ id: "word-1" });
  });

  it("should upsert lines and then upsert token chunks", async () => {
    lineRepository.find.mockResolvedValueOnce([
      { data: "amo", id: "line-1", index: 0 },
      { data: "cano", id: "line-2", index: 1 },
    ] as unknown as Line[]);

    const text = {
      author: { slug: "vergil" },
      id: "text-id",
      slug: "vergil/aeneid",
      title: "Aeneid",
    } as unknown as Text;

    const upsertAndFetchLines = (
      literatureService as unknown as {
        upsertAndFetchLines: (
          lineEntities: {
            data: string;
            index: number;
            label: string;
            text: Text;
          }[],
          text: Text,
        ) => Promise<Line[]>;
      }
    ).upsertAndFetchLines.bind(literatureService);

    const savedLines = await upsertAndFetchLines(
      [
        { data: "amo", index: 0, label: "1", text },
        { data: "cano", index: 1, label: "2", text },
      ],
      text,
    );

    expect(savedLines).toHaveLength(2);

    await (
      literatureService as unknown as {
        upsertTokens: (
          tokenEntities: { data: string; index: number }[],
          text: Text,
        ) => Promise<void>;
      }
    ).upsertTokens(
      [
        { data: "amo", index: 0 },
        { data: ",", index: 1 },
      ],
      text,
    );

    expect(tokenRepository.upsert).toHaveBeenCalledTimes(1);
  });

  it("should warn when ingesting text without paragraphs", async () => {
    const getWordsCacheSpy = vi
      .spyOn(
        literatureService as unknown as {
          getWordsCache: () => Promise<Map<string, string>>;
        },
        "getWordsCache",
      )
      .mockResolvedValue(new Map());

    const text = {
      author: { slug: "vergil" },
      id: "text-id",
      slug: "vergil/aeneid",
      title: "Aeneid",
    } as unknown as Text;

    await (
      literatureService as unknown as {
        ingestLines: (
          textToIngest: Text,
          ast: { children: unknown[]; type: string },
        ) => Promise<void>;
      }
    ).ingestLines(text, { children: [], type: "root" });

    expect(getWordsCacheSpy).toHaveBeenCalledTimes(1);
    expect(loggerService.warn).toHaveBeenCalledWith(
      "⚠️ NO LINES in vergil/aeneid",
    );
  });

  it("should extract and upsert tokens when ingesting lines", async () => {
    const getWordsCacheSpy = vi
      .spyOn(
        literatureService as unknown as {
          getWordsCache: () => Promise<Map<string, string>>;
        },
        "getWordsCache",
      )
      .mockResolvedValue(new Map([["amo", "word-1"]]));

    const upsertAndFetchLinesSpy = vi
      .spyOn(
        literatureService as unknown as {
          upsertAndFetchLines: (
            lineEntities: unknown[],
            text: Text,
          ) => Promise<Line[]>;
        },
        "upsertAndFetchLines",
      )
      .mockResolvedValue([
        {
          data: "amo",
          id: "line-1",
          index: 0,
        } as Line,
      ]);

    const extractTokensFromLineSpy = vi
      .spyOn(
        literatureService as unknown as {
          extractTokensFromLine: (
            line: Line,
            text: Text,
            wordMap: Map<string, string>,
          ) => unknown[];
        },
        "extractTokensFromLine",
      )
      .mockReturnValue([{ data: "amo", index: 0 }]);

    const upsertTokensSpy = vi
      .spyOn(
        literatureService as unknown as {
          upsertTokens: (tokenEntities: unknown[], text: Text) => Promise<void>;
        },
        "upsertTokens",
      )
      .mockResolvedValue(undefined);

    const text = {
      author: { slug: "vergil" },
      id: "text-id",
      slug: "vergil/aeneid",
      title: "Aeneid",
    } as unknown as Text;

    await (
      literatureService as unknown as {
        ingestLines: (
          textToIngest: Text,
          ast: { children: unknown[]; type: string },
        ) => Promise<void>;
      }
    ).ingestLines(text, {
      children: [
        {
          children: [{ type: "text", value: "amo" }],
          type: "paragraph",
        },
      ],
      type: "root",
    });

    expect(getWordsCacheSpy).toHaveBeenCalledTimes(1);
    expect(upsertAndFetchLinesSpy).toHaveBeenCalledTimes(1);
    expect(extractTokensFromLineSpy).toHaveBeenCalledTimes(1);
    expect(upsertTokensSpy).toHaveBeenCalledWith(
      [{ data: "amo", index: 0 }],
      text,
    );
  });

  it("should ensure parent texts for nested path parts", async () => {
    textRepository.findOneOrFail
      .mockResolvedValueOnce({
        author: { slug: "vergil" },
        id: "book-1-id",
        slug: "vergil/book-1",
        title: "Book 1",
      } as unknown as Text)
      .mockResolvedValueOnce({
        author: { slug: "vergil" },
        id: "book-1-a-id",
        slug: "vergil/book-1/section-a",
        title: "Section A",
      } as unknown as Text);

    const parentTexts = await (
      literatureService as unknown as {
        ensureParentTexts: (
          authorEntity: Author,
          authorSlug: string,
          texts: LibraryEntry[],
        ) => Promise<Map<string, Text>>;
      }
    ).ensureParentTexts({ slug: "vergil" } as unknown as Author, "vergil", [
      {
        authorSlug: "vergil",
        fullPath: "/tmp/vergil/book-1/section-a.md",
        pathParts: ["book-1", "section-a"],
        provider: "perseus",
        textSlug: "aeneid",
        title: "Aeneid",
      },
    ]);

    expect(textRepository.upsert).toHaveBeenCalledTimes(2);
    expect(parentTexts.has("vergil/book-1/section-a")).toBe(true);
  });

  it("should skip duplicate and empty parent path parts", async () => {
    textRepository.findOneOrFail
      .mockResolvedValueOnce({
        author: { slug: "vergil" },
        id: "book-1-id",
        slug: "vergil/book-1",
        title: "Book 1",
      } as unknown as Text)
      .mockResolvedValueOnce({
        author: { slug: "vergil" },
        id: "book-1-a-id",
        slug: "vergil/book-1/section-a",
        title: "Section A",
      } as unknown as Text);

    const parentTexts = await (
      literatureService as unknown as {
        ensureParentTexts: (
          authorEntity: Author,
          authorSlug: string,
          texts: LibraryEntry[],
        ) => Promise<Map<string, Text>>;
      }
    ).ensureParentTexts({ slug: "vergil" } as unknown as Author, "vergil", [
      {
        authorSlug: "vergil",
        fullPath: "/tmp/vergil/book-1/section-a.md",
        pathParts: ["book-1", "section-a"],
        provider: "perseus",
        textSlug: "aeneid",
        title: "Aeneid",
      },
      {
        authorSlug: "vergil",
        fullPath: "/tmp/vergil/book-1/section-a-duplicate.md",
        pathParts: ["book-1", "section-a"],
        provider: "perseus",
        textSlug: "aeneid-duplicate",
        title: "Aeneid Duplicate",
      },
      {
        authorSlug: "vergil",
        fullPath: "/tmp/vergil/root.md",
        pathParts: [],
        provider: "perseus",
        textSlug: "root",
        title: "Root",
      },
    ]);

    expect(textRepository.upsert).toHaveBeenCalledTimes(2);
    expect(parentTexts.has("vergil/book-1")).toBe(true);
    expect(parentTexts.has("vergil/book-1/section-a")).toBe(true);
  });

  it("should use start-case author name fallback when ingesting unknown author group", async () => {
    const ensureParentTextsSpy = vi
      .spyOn(
        literatureService as unknown as {
          ensureParentTexts: (
            authorEntity: Author,
            authorSlug: string,
            texts: LibraryEntry[],
          ) => Promise<Map<string, Text>>;
        },
        "ensureParentTexts",
      )
      .mockResolvedValue(new Map());

    const ingestTextChunksSpy = vi
      .spyOn(
        literatureService as unknown as {
          ingestTextChunks: (args: {
            authorEntity: Author;
            authorSlug: string;
            parentTexts: Map<string, Text>;
            texts: LibraryEntry[];
          }) => Promise<void>;
        },
        "ingestTextChunks",
      )
      .mockResolvedValue(undefined);

    authorRepository.findOneOrFail.mockResolvedValueOnce({
      id: "author-id",
      slug: "unknown-author",
    } as unknown as Author);

    await (
      literatureService as unknown as {
        ingestAuthorGroup: (
          authorSlug: string,
          texts: LibraryEntry[],
        ) => Promise<void>;
      }
    ).ingestAuthorGroup("unknown-author", []);

    expect(authorRepository.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Unknown Author",
        slug: "unknown-author",
      }),
      expect.objectContaining({}),
    );
    expect(ensureParentTextsSpy).toHaveBeenCalledTimes(1);
    expect(ingestTextChunksSpy).toHaveBeenCalledTimes(1);
  });

  it("should save text metadata and parent relation when present", async () => {
    textRepository.findOneOrFail.mockResolvedValueOnce({
      author: { slug: "vergil" },
      id: "text-id",
      slug: "vergil/book-1/aeneid",
      title: "Aeneid",
    } as unknown as Text);

    await (
      literatureService as unknown as {
        saveTextToDatabase: (args: {
          author: Author;
          frontmatterData: Record<string, unknown>;
          parentText: Text | undefined;
          textSlug: string;
          title: string;
        }) => Promise<Text>;
      }
    ).saveTextToDatabase({
      author: { slug: "vergil" } as unknown as Author,
      frontmatterData: { text_metadata: { meter: "dactylic hexameter" } },
      parentText: { id: "parent-id", slug: "vergil/book-1" } as Text,
      textSlug: "vergil/book-1/aeneid",
      title: "Aeneid",
    });

    const upsertCallArguments = textRepository.upsert.mock.calls[0] as
      | [
          {
            metadata?: { meter?: string };
            parentText?: { id?: string };
          },
          unknown,
        ]
      | undefined;

    expect(upsertCallArguments).toBeDefined();
    expect(upsertCallArguments?.[0].metadata?.meter).toBe("dactylic hexameter");
    expect(upsertCallArguments?.[0].parentText?.id).toBe("parent-id");
    expect(upsertCallArguments?.[1]).toBeDefined();
  });

  it("should ingest text by parsing frontmatter and lines", async () => {
    const ingestLinesSpy = vi
      .spyOn(
        literatureService as unknown as {
          ingestLines: (
            text: Text,
            ast: { children: unknown[]; type: string },
          ) => Promise<void>;
        },
        "ingestLines",
      )
      .mockResolvedValue(undefined);

    textRepository.findOneOrFail.mockResolvedValueOnce({
      author: { slug: "vergil" },
      id: "text-id",
      slug: "vergil/aeneid",
      title: "Aeneid",
    } as unknown as Text);

    readFileMock.mockResolvedValueOnce(
      `---\ntext_metadata:\n  genre: epic\n---\n\nI. arma virumque cano`,
    );

    await (
      literatureService as unknown as {
        ingestText: (args: {
          author: Author;
          parentText?: Text;
          textPath: string;
          textSlugName: string;
          title: string;
        }) => Promise<void>;
      }
    ).ingestText({
      author: { slug: "vergil" } as unknown as Author,
      textPath: "/tmp/aeneid.md",
      textSlugName: "aeneid",
      title: "Aeneid",
    });

    expect(textRepository.upsert).toHaveBeenCalledTimes(1);
    expect(ingestLinesSpy).toHaveBeenCalledTimes(1);
  });

  it("should merge and save author metadata from frontmatter", async () => {
    const ingestLinesSpy = vi
      .spyOn(
        literatureService as unknown as {
          ingestLines: (
            text: Text,
            ast: { children: unknown[]; type: string },
          ) => Promise<void>;
        },
        "ingestLines",
      )
      .mockResolvedValue(undefined);

    readFileMock.mockResolvedValueOnce(
      `---\nauthor_metadata:\n  era: classical\n---\n\nI. amo`,
    );

    const author = {
      metadata: { region: "italy" },
      slug: "vergil",
    } as unknown as Author;

    await (
      literatureService as unknown as {
        ingestText: (args: {
          author: Author;
          parentText?: Text;
          textPath: string;
          textSlugName: string;
          title: string;
        }) => Promise<void>;
      }
    ).ingestText({
      author,
      textPath: "/tmp/vergil/amo.md",
      textSlugName: "amo",
      title: "Amo",
    });

    expect(authorRepository.save).toHaveBeenCalledWith(author);
    expect(author.metadata).toStrictEqual({
      era: "classical",
      region: "italy",
    });
    expect(ingestLinesSpy).toHaveBeenCalledTimes(1);
  });

  it("should delegate ingest text chunks through text ingestion service", async () => {
    const ingestTextSpy = vi
      .spyOn(
        literatureService as unknown as {
          ingestText: (args: {
            author: Author;
            parentText?: Text;
            textPath: string;
            textSlugName: string;
            title: string;
          }) => Promise<void>;
        },
        "ingestText",
      )
      .mockResolvedValue(undefined);

    literatureTextIngestionService.ingestTextWithLogging.mockImplementation(
      async (
        ingestTextDelegate: {
          ingestText: (args: IngestTextArguments) => Promise<void>;
        },
        payload: {
          authorEntity: Author;
          authorSlug: string;
          currentText: number;
          logFilePath: string;
          parentTexts: Map<string, Text>;
          textEntry: LibraryEntry;
          totalTexts: number;
        },
      ) => {
        const parentText = payload.parentTexts.get("vergil");
        await ingestTextDelegate.ingestText({
          author: payload.authorEntity,
          parentText,
          textPath: payload.textEntry.fullPath,
          textSlugName: payload.textEntry.textSlug,
          title: payload.textEntry.title,
        });
      },
    );

    await (
      literatureService as unknown as {
        ingestTextChunks: (args: {
          authorEntity: Author;
          authorSlug: string;
          parentTexts: Map<string, Text>;
          texts: LibraryEntry[];
        }) => Promise<void>;
      }
    ).ingestTextChunks({
      authorEntity: { slug: "vergil" } as Author,
      authorSlug: "vergil",
      parentTexts: new Map(),
      texts: [
        {
          authorSlug: "vergil",
          fullPath: "/tmp/vergil/aeneid.md",
          pathParts: [],
          provider: "perseus",
          textSlug: "aeneid",
          title: "Aeneid",
        },
      ],
    });

    expect(
      literatureTextIngestionService.ingestTextWithLogging,
    ).toHaveBeenCalledTimes(1);
    expect(ingestTextSpy).toHaveBeenCalledTimes(1);
  });

  it("should delegate scanLibrary and ingest grouped authors", async () => {
    const entries: LibraryEntry[] = [
      {
        authorSlug: "vergil",
        fullPath: "/tmp/vergil/aeneid.md",
        pathParts: ["book-1"],
        provider: "perseus",
        textSlug: "aeneid",
        title: "Aeneid",
      },
      {
        authorSlug: "ovid",
        fullPath: "/tmp/ovid/metamorphoses.md",
        pathParts: [],
        provider: "perseus",
        textSlug: "metamorphoses",
        title: "Metamorphoses",
      },
    ];

    literatureLibraryScanService.scanLibrary.mockResolvedValueOnce(entries);

    const ingestAuthorGroupSpy = vi
      .spyOn(
        literatureService as unknown as {
          ingestAuthorGroup: (
            authorSlug: string,
            texts: LibraryEntry[],
          ) => Promise<void>;
        },
        "ingestAuthorGroup",
      )
      .mockResolvedValue(undefined);

    const result = await literatureService.scanLibrary();
    await literatureService.ingestAllAuthors(entries);

    expect(result).toStrictEqual(entries);
    expect(ingestAuthorGroupSpy).toHaveBeenCalledTimes(2);
  });
});
