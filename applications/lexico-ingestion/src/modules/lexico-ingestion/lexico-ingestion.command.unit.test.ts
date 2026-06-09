import { Test } from "@nestjs/testing";
import { beforeAll, describe, expect, it } from "vitest";

import { ClearCommand } from "../clear/clear.command";
import { DictionaryCommand } from "../dictionary/dictionary.command";
import { LoggerService } from "../logger/logger.service";
import { ManualService } from "../manual/manual.service";
import { WiktionaryCommand } from "../wiktionary/wiktionary.command";

import { LexicoIngestionCommand } from "./lexico-ingestion.command";

describe("LexicoIngestionCommand", () => {
  let command: LexicoIngestionCommand;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        LexicoIngestionCommand,
        { provide: LoggerService, useValue: { setContext: () => {} } },
        { provide: ClearCommand, useValue: {} },
        { provide: WiktionaryCommand, useValue: {} },
        { provide: DictionaryCommand, useValue: {} },
        { provide: ManualService, useValue: {} },
      ],
    }).compile();
    command = await module.resolve(LexicoIngestionCommand);
  });

  it("should be defined", () => {
    expect(command).toBeDefined();
  });
});
