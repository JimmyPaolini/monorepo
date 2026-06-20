import { Test } from "@nestjs/testing";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LoggerModule } from "../logger/logger.module";
import { LoggerService } from "../logger/logger.service";

import { LiteratureCommand } from "./literature.command";
import { LiteratureService } from "./literature.service";

import type { LibraryEntry } from "./literature.types";

describe("LiteratureCommand", () => {
  let command: LiteratureCommand;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        LiteratureCommand,
        {
          provide: LiteratureService,
          useValue: createLiteratureServiceMock(),
        },
        { provide: LoggerService, useValue: createLoggerServiceMock() },
      ],
    }).compile();

    command = await module.resolve(LiteratureCommand);
  });

  it("is defined", () => {
    expect(command).toBeDefined();
  });
});

const { promptsMock } = vi.hoisted(() => ({
  promptsMock: vi.fn(),
}));

vi.mock("prompts", () => ({
  default: promptsMock,
}));

function createLiteratureServiceMock(): {
  ingestAllAuthors: ReturnType<typeof vi.fn>;
  scanLibrary: ReturnType<typeof vi.fn>;
} {
  return {
    ingestAllAuthors: vi.fn(),
    scanLibrary: vi.fn(),
  };
}

function createLoggerServiceMock(): {
  log: ReturnType<typeof vi.fn>;
  setContext: ReturnType<typeof vi.fn>;
  warn: ReturnType<typeof vi.fn>;
} {
  return {
    log: vi.fn(),
    setContext: vi.fn(),
    warn: vi.fn(),
  };
}

describe("LiteratureCommand", () => {
  let command: LiteratureCommand;

  const library: LibraryEntry[] = [
    {
      authorSlug: "ovid",
      fullPath: "/tmp/ovid/metamorphoses.md",
      pathParts: ["ovid"],
      provider: "perseus",
      textSlug: "metamorphoses",
      title: "Metamorphoses",
    },
    {
      authorSlug: "vergil",
      fullPath: "/tmp/vergil/aeneid.md",
      pathParts: ["vergil"],
      provider: "thelatinlibrary",
      textSlug: "aeneid",
      title: "Aeneid",
    },
    {
      authorSlug: "vergil",
      fullPath: "/tmp/vergil/aeneid-alt.md",
      pathParts: ["vergil"],
      provider: "perseus",
      textSlug: "aeneid",
      title: "Aeneid",
    },
  ];

  const loggerService = {
    log: vi.fn(),
    setContext: vi.fn(),
    warn: vi.fn(),
  };

  const literatureService = {
    ingestAllAuthors: vi.fn(),
    scanLibrary: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    promptsMock.mockResolvedValue({ provider: "ALL" });

    const moduleRef = await Test.createTestingModule({
      providers: [
        LiteratureCommand,
        { provide: LiteratureService, useValue: literatureService },
        { provide: LoggerService, useValue: loggerService },
      ],
    }).compile();

    command = await moduleRef.resolve(LiteratureCommand);
  });

  it("is defined", () => {
    expect(command).toBeDefined();
    expect(loggerService.setContext).toHaveBeenCalledWith("LiteratureCommand");
  });

  it("should parse provider from explicit valid option", async () => {
    literatureService.scanLibrary.mockResolvedValue(library);

    const provider = await command.parseProvider("perseus");

    expect(provider).toBe("perseus");
    expect(promptsMock).not.toHaveBeenCalled();
  });

  it("should throw for explicit invalid provider option", async () => {
    literatureService.scanLibrary.mockResolvedValue(library);

    await expect(command.parseProvider("invalid-provider")).rejects.toThrow(
      'Provider "invalid-provider" not found in the dataset.',
    );
  });

  it("should return undefined when interactive provider selects all", async () => {
    literatureService.scanLibrary.mockResolvedValue(library);
    promptsMock.mockResolvedValue({ provider: "ALL" });

    const provider = await command.parseProvider(undefined);

    expect(provider).toBeUndefined();
    expect(promptsMock).toHaveBeenCalledTimes(1);
  });

  it("should return undefined when provider prompt returns non-string", async () => {
    literatureService.scanLibrary.mockResolvedValue(library);
    promptsMock.mockResolvedValue({ provider: 123 });

    const provider = await command.parseProvider(undefined);

    expect(provider).toBeUndefined();
  });

  it("should parse author constrained by provider", async () => {
    literatureService.scanLibrary.mockResolvedValue(library);

    const author = await command.parseAuthor("ovid", "perseus");

    expect(author).toBe("ovid");
  });

  it("should return selected author from interactive prompt", async () => {
    literatureService.scanLibrary.mockResolvedValue(library);
    promptsMock.mockResolvedValue({ author: "vergil" });

    const author = await command.parseAuthor(undefined, undefined);

    expect(author).toBe("vergil");
  });

  it("should return undefined when interactive author selects all", async () => {
    literatureService.scanLibrary.mockResolvedValue(library);
    promptsMock.mockResolvedValue({ author: "ALL" });

    const author = await command.parseAuthor(undefined, undefined);

    expect(author).toBeUndefined();
  });

  it("should throw for invalid author in constrained provider", async () => {
    literatureService.scanLibrary.mockResolvedValue(library);

    await expect(
      command.parseAuthor("ovid", "thelatinlibrary"),
    ).rejects.toThrow('Author "ovid" not found in the dataset.');
  });

  it("should parse explicit text option", async () => {
    literatureService.scanLibrary.mockResolvedValue(library);

    const text = await command.parseText(
      "vergil/vergil/aeneid",
      "perseus",
      "vergil",
    );

    expect(text).toBe("vergil/vergil/aeneid");
  });

  it("should return selected text from interactive prompt", async () => {
    literatureService.scanLibrary.mockResolvedValue(library);
    promptsMock.mockResolvedValue({ text: "vergil/vergil/aeneid" });

    const text = await command.parseText(undefined, "perseus", "vergil");

    expect(text).toBe("vergil/vergil/aeneid");
  });

  it("should return undefined when interactive text selects all", async () => {
    literatureService.scanLibrary.mockResolvedValue(library);
    promptsMock.mockResolvedValue({ text: "ALL" });

    const text = await command.parseText(undefined, "perseus", "vergil");

    expect(text).toBeUndefined();
  });

  it("should return undefined when text prompt returns non-string", async () => {
    literatureService.scanLibrary.mockResolvedValue(library);
    promptsMock.mockResolvedValue({ text: 999 });

    const text = await command.parseText(undefined, "perseus", "vergil");

    expect(text).toBeUndefined();
  });

  it("should normalize non-string provider and author arguments in parseText", async () => {
    literatureService.scanLibrary.mockResolvedValue(library);
    promptsMock.mockResolvedValue({ text: "ALL" });

    const text = await command.parseText(
      undefined,
      123 as unknown as string,
      null as unknown as string,
    );

    expect(text).toBeUndefined();
  });

  it("should get text choices filtered by provider only", async () => {
    literatureService.scanLibrary.mockResolvedValue(library);

    const getTextChoices = (
      command as unknown as {
        getTextChoices: (
          provider?: string,
          authorSlug?: string,
        ) => Promise<{ title: string; value: string }[]>;
      }
    ).getTextChoices.bind(command);

    const choices = await getTextChoices("thelatinlibrary", undefined);

    expect(choices).toEqual([
      { title: "vergil/vergil/aeneid", value: "vergil/vergil/aeneid" },
    ]);
  });

  it("should get text choices filtered by author only", async () => {
    literatureService.scanLibrary.mockResolvedValue(library);

    const getTextChoices = (
      command as unknown as {
        getTextChoices: (
          provider?: string,
          authorSlug?: string,
        ) => Promise<{ title: string; value: string }[]>;
      }
    ).getTextChoices.bind(command);

    const choices = await getTextChoices(undefined, "ovid");

    expect(choices).toEqual([
      { title: "ovid/ovid/metamorphoses", value: "ovid/ovid/metamorphoses" },
    ]);
  });

  it("should select texts with only text filter", () => {
    const selectTextsToIngest = (
      command as unknown as {
        selectTextsToIngest: (args: {
          author: string | undefined;
          library: LibraryEntry[];
          provider: string | undefined;
          text: string | undefined;
        }) => LibraryEntry[];
      }
    ).selectTextsToIngest.bind(command);

    const selected = selectTextsToIngest({
      author: undefined,
      library,
      provider: undefined,
      text: "vergil/vergil/aeneid",
    });

    expect(selected).toHaveLength(1);
    expect(selected[0]?.textSlug).toBe("aeneid");
  });

  it("should prioritize known providers when deduplicating texts", () => {
    const deduplicateByProvider = (
      command as unknown as {
        deduplicateByProvider: (texts: LibraryEntry[]) => LibraryEntry[];
      }
    ).deduplicateByProvider.bind(command);

    const result = deduplicateByProvider([
      {
        authorSlug: "vergil",
        fullPath: "/tmp/vergil/aeneid-unknown.md",
        pathParts: ["vergil"],
        provider: "unknown-provider",
        textSlug: "aeneid",
        title: "Aeneid",
      },
      {
        authorSlug: "vergil",
        fullPath: "/tmp/vergil/aeneid-perseus.md",
        pathParts: ["vergil"],
        provider: "perseus",
        textSlug: "aeneid",
        title: "Aeneid",
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]?.provider).toBe("perseus");
  });

  it("should keep existing known provider when new provider has lower priority", () => {
    const deduplicateByProvider = (
      command as unknown as {
        deduplicateByProvider: (texts: LibraryEntry[]) => LibraryEntry[];
      }
    ).deduplicateByProvider.bind(command);

    const result = deduplicateByProvider([
      {
        authorSlug: "vergil",
        fullPath: "/tmp/vergil/aeneid-perseus.md",
        pathParts: ["vergil"],
        provider: "perseus",
        textSlug: "aeneid",
        title: "Aeneid",
      },
      {
        authorSlug: "vergil",
        fullPath: "/tmp/vergil/aeneid-ttl.md",
        pathParts: ["vergil"],
        provider: "thelatinlibrary",
        textSlug: "aeneid",
        title: "Aeneid",
      },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0]?.provider).toBe("perseus");
  });

  it("should throw for invalid text option", async () => {
    literatureService.scanLibrary.mockResolvedValue(library);

    await expect(
      command.parseText("missing/text", "perseus", "vergil"),
    ).rejects.toThrow('Text "missing/text" not found in the dataset.');
  });

  it("should run and ingest selected deduplicated texts", async () => {
    literatureService.scanLibrary.mockResolvedValue(library);
    literatureService.ingestAllAuthors.mockResolvedValue(undefined);

    const parseProviderSpy = vi
      .spyOn(command, "parseProvider")
      .mockResolvedValue("perseus");
    const parseAuthorSpy = vi
      .spyOn(command, "parseAuthor")
      .mockResolvedValue("vergil");
    const parseTextSpy = vi
      .spyOn(command, "parseText")
      .mockResolvedValue(undefined);

    await command.run([], {});

    expect(parseProviderSpy).toHaveBeenCalledWith(undefined);
    expect(parseAuthorSpy).toHaveBeenCalledWith(undefined, "perseus");
    expect(parseTextSpy).toHaveBeenCalledWith(undefined, "perseus", "vergil");

    expect(literatureService.ingestAllAuthors).toHaveBeenCalledTimes(1);
    const ingestedTexts = literatureService.ingestAllAuthors.mock
      .calls[0]?.[0] as LibraryEntry[] | undefined;
    expect(ingestedTexts).toBeDefined();
    expect(ingestedTexts).toHaveLength(1);
    expect(ingestedTexts?.[0]?.provider).toBe("perseus");

    expect(loggerService.log).toHaveBeenCalledWith(
      "📚 Starting literature ingestion...",
    );
    expect(loggerService.log).toHaveBeenCalledWith(
      expect.stringContaining("📚 Literature ingestion complete in"),
    );
  });

  it("should stop early when library is empty", async () => {
    literatureService.scanLibrary.mockResolvedValue([]);

    await command.run([], {});

    expect(loggerService.warn).toHaveBeenCalledWith(
      "⚠️ No texts found in data/library directory.",
    );
    expect(literatureService.ingestAllAuthors).not.toHaveBeenCalled();
  });
});
