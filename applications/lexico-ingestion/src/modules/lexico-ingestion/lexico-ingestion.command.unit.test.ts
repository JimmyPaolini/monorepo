import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

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

describe("LexicoIngestionCommand", () => {
  let command: LexicoIngestionCommand;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        LexicoIngestionCommand,
        {
          provide: LoggerService,
          useValue: { log: () => {}, setContext: () => {} },
        },
        {
          provide: CorpusScriptorumEcclesiasticorumLatinorumCommand,
          useValue: {},
        },
        { provide: DictionaryCommand, useValue: {} },
        { provide: EpigraphikDatenbankClaussSlabyCommand, useValue: {} },
        { provide: LatinLibraryCommand, useValue: {} },
        { provide: LibraryCommand, useValue: {} },
        { provide: LiteratureCommand, useValue: {} },
        { provide: PerseusCommand, useValue: {} },
        { provide: WiktionaryCommand, useValue: {} },
      ],
    }).compile();
    command = await module.resolve(LexicoIngestionCommand);
  });

  it("should be defined", () => {
    expect(command).toBeDefined();
  });
});
