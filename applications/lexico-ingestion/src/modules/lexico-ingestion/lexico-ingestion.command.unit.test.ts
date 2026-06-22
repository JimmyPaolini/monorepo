import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, it } from "vitest";

import { CorpusScriptorumEcclesiasticorumLatinorumCommand } from "../corpus-scriptorum-ecclesiasticorum-latinorum/corpus-scriptorum-ecclesiasticorum-latinorum.command";
import { DictionaryCommand } from "../dictionary/dictionary.command";
import { EpigraphikDatenbankClaussSlabyCommand } from "../epigraphik-datenbank-clauss-slaby/epigraphik-datenbank-clauss-slaby.command";
import { LatinLibraryCommand } from "../latin-library/latin-library.command";
import { LibraryCommand } from "../library/library.command";
import { LiteratureCommand } from "../literature/literature.command";
import { LoggerService } from "../logger/logger.service";
import { PerseusCommand } from "../perseus/perseus.command";
import { WiktionaryCommand } from "../wiktionary/wiktionary.command";

import { LexicoIngestionCommand } from "./lexico-ingestion.command";

import type { LexicoIngestionCommandOptions } from "./lexico-ingestion.types";

const { promptsMock } = vi.hoisted(() => ({
  promptsMock: vi.fn<() => Promise<Record<string, boolean>>>(),
}));

vi.mock("prompts", () => ({
  default: promptsMock,
}));

describe(LexicoIngestionCommand, () => {
  let lexicoIngestionCommand: LexicoIngestionCommand;

  const loggerService = {
    log: vi.fn<(...parameters: unknown[]) => void>(),
    setContext: vi.fn<(context: string) => void>(),
  };

  const corpusScriptorumEcclesiasticorumLatinorumCommand = {
    run: vi.fn<() => Promise<void>>(async () => {}),
  };

  const dictionaryCommand = {
    ingestAll: vi.fn<() => Promise<void>>(async () => {}),
  };

  const epigraphikDatenbankClaussSlabyCommand = {
    run: vi.fn<() => Promise<void>>(async () => {}),
  };

  const latinLibraryCommand = {
    run: vi.fn<() => Promise<void>>(async () => {}),
  };

  const libraryCommand = {
    run: vi.fn<() => Promise<void>>(async () => {}),
  };

  const literatureCommand = {
    run: vi.fn<() => Promise<void>>(async () => {}),
  };

  const perseusCommand = {
    run: vi.fn<() => Promise<void>>(async () => {}),
  };

  const wiktionaryCommand = {
    run: vi.fn<() => Promise<void>>(async () => {}),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    promptsMock.mockResolvedValue({ value: true });

    const moduleRef = await Test.createTestingModule({
      providers: [
        LexicoIngestionCommand,
        {
          provide: LoggerService,
          useValue: loggerService,
        },
        {
          provide: CorpusScriptorumEcclesiasticorumLatinorumCommand,
          useValue: corpusScriptorumEcclesiasticorumLatinorumCommand,
        },
        { provide: DictionaryCommand, useValue: dictionaryCommand },
        {
          provide: EpigraphikDatenbankClaussSlabyCommand,
          useValue: epigraphikDatenbankClaussSlabyCommand,
        },
        { provide: LatinLibraryCommand, useValue: latinLibraryCommand },
        { provide: LibraryCommand, useValue: libraryCommand },
        { provide: LiteratureCommand, useValue: literatureCommand },
        { provide: PerseusCommand, useValue: perseusCommand },
        { provide: WiktionaryCommand, useValue: wiktionaryCommand },
      ],
    }).compile();

    lexicoIngestionCommand = await moduleRef.resolve(LexicoIngestionCommand);
  });

  it("is defined", () => {
    expect(lexicoIngestionCommand).toBeDefined();
    expect(loggerService.setContext).toHaveBeenCalledWith(
      "LexicoIngestionCommand",
    );
  });

  it("should parse all boolean options", () => {
    expect(lexicoIngestionCommand.parseWikipedia(undefined)).toBe(true);
    expect(lexicoIngestionCommand.parseWikipedia("false")).toBe(false);
    expect(lexicoIngestionCommand.parseWikipedia("0")).toBe(false);

    expect(lexicoIngestionCommand.parseDictionary(undefined)).toBe(true);
    expect(lexicoIngestionCommand.parseDictionary("false")).toBe(false);

    expect(lexicoIngestionCommand.parseLibrarySources(undefined)).toBe(true);
    expect(lexicoIngestionCommand.parseLibrarySources("0")).toBe(false);

    expect(lexicoIngestionCommand.parseLibrary(undefined)).toBe(true);
    expect(lexicoIngestionCommand.parseLibrary("false")).toBe(false);

    expect(lexicoIngestionCommand.parseLiterature(undefined)).toBe(true);
    expect(lexicoIngestionCommand.parseLiterature("0")).toBe(false);
  });

  it("should return provided prompt option values without prompting", async () => {
    const result = await (
      lexicoIngestionCommand as unknown as {
        promptOption: (
          currentValue: boolean | undefined,
          message: string,
          name: string,
        ) => Promise<boolean>;
      }
    ).promptOption(true, "message", "name");

    expect(result).toBe(true);
    expect(promptsMock).not.toHaveBeenCalled();
  });

  it("should prompt when option value is missing", async () => {
    promptsMock.mockResolvedValue({ wikipedia: false });

    const result = await (
      lexicoIngestionCommand as unknown as {
        promptOption: (
          currentValue: boolean | undefined,
          message: string,
          name: string,
        ) => Promise<boolean>;
      }
    ).promptOption(undefined, "Run wikipedia?", "wikipedia");

    expect(result).toBe(false);
    expect(promptsMock).toHaveBeenCalledTimes(1);
  });

  it("should run selected stages in order", async () => {
    const options: LexicoIngestionCommandOptions = {
      dictionary: true,
      library: true,
      librarySources: true,
      literature: true,
      wikipedia: true,
    };

    const promptForMissingOptionsSpy = vi
      .spyOn(
        lexicoIngestionCommand as unknown as {
          promptForMissingOptions: (
            optionsToPrompt: LexicoIngestionCommandOptions,
          ) => Promise<void>;
        },
        "promptForMissingOptions",
      )
      .mockResolvedValue(undefined);

    await lexicoIngestionCommand.run([], options);

    expect(promptForMissingOptionsSpy).toHaveBeenCalledWith(options);
    expect(wiktionaryCommand.run).toHaveBeenCalledTimes(1);
    expect(dictionaryCommand.ingestAll).toHaveBeenCalledTimes(1);
    expect(perseusCommand.run).toHaveBeenCalledTimes(1);
    expect(latinLibraryCommand.run).toHaveBeenCalledTimes(1);
    expect(
      corpusScriptorumEcclesiasticorumLatinorumCommand.run,
    ).toHaveBeenCalledTimes(1);
    expect(epigraphikDatenbankClaussSlabyCommand.run).toHaveBeenCalledTimes(1);
    expect(libraryCommand.run).toHaveBeenCalledWith([], {});
    expect(literatureCommand.run).toHaveBeenCalledWith([], {});
    expect(loggerService.log).toHaveBeenCalledWith(
      "✅ Full ingestion pipeline complete 🎉",
    );
  });

  it("should skip disabled stages", async () => {
    const options: LexicoIngestionCommandOptions = {
      dictionary: false,
      library: false,
      librarySources: false,
      literature: false,
      wikipedia: false,
    };

    const promptForMissingOptionsSpy = vi
      .spyOn(
        lexicoIngestionCommand as unknown as {
          promptForMissingOptions: (
            optionsToPrompt: LexicoIngestionCommandOptions,
          ) => Promise<void>;
        },
        "promptForMissingOptions",
      )
      .mockResolvedValue(undefined);

    await lexicoIngestionCommand.run([], options);

    expect(promptForMissingOptionsSpy).toHaveBeenCalledWith(options);
    expect(wiktionaryCommand.run).not.toHaveBeenCalled();
    expect(dictionaryCommand.ingestAll).not.toHaveBeenCalled();
    expect(perseusCommand.run).not.toHaveBeenCalled();
    expect(libraryCommand.run).not.toHaveBeenCalled();
    expect(literatureCommand.run).not.toHaveBeenCalled();
  });

  it("should run only library sources stage helper", async () => {
    await (
      lexicoIngestionCommand as unknown as {
        runLibrarySourcesStage: () => Promise<void>;
      }
    ).runLibrarySourcesStage();

    expect(perseusCommand.run).toHaveBeenCalledTimes(1);
    expect(latinLibraryCommand.run).toHaveBeenCalledTimes(1);
    expect(
      corpusScriptorumEcclesiasticorumLatinorumCommand.run,
    ).toHaveBeenCalledTimes(1);
    expect(epigraphikDatenbankClaussSlabyCommand.run).toHaveBeenCalledTimes(1);
  });
});
