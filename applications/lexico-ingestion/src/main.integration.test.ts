import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";

import { ClearService } from "./modules/clear/clear.service";
import { DictionaryService } from "./modules/dictionary/dictionary.service";
import { LexicoIngestionCommand } from "./modules/lexico-ingestion/lexico-ingestion.command";
import { LoggerService } from "./modules/logger/logger.service";
import { ManualService } from "./modules/manual/manual.service";
import { WiktionaryService } from "./modules/wiktionary/wiktionary.service";
import { WordsService } from "./modules/words/words.service";

describe("LexicoIngestionCommand", () => {
  it("can be created by the Nest testing module", async () => {
    const module = await Test.createTestingModule({
      providers: [
        LexicoIngestionCommand,
        {
          provide: LoggerService,
          useValue: { setContext: () => {}, log: () => {} },
        },
        { provide: ClearService, useValue: {} },
        { provide: WiktionaryService, useValue: {} },
        { provide: DictionaryService, useValue: {} },
        { provide: ManualService, useValue: {} },
        { provide: WordsService, useValue: {} },
      ],
    }).compile();

    const command = module.get(LexicoIngestionCommand);
    expect(command).toBeDefined();
  });
});
