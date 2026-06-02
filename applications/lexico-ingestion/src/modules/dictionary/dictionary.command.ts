import { Injectable } from "@nestjs/common";
import { Command, CommandRunner, Option } from "nest-commander";

import { ManualService } from "../manual/manual.service.js";

import { DictionaryService } from "./dictionary.service.js";

interface DictionaryCommandOptions {
  word?: string;
}

/**
 * Ingest dictionary entries from Wiktionary HTML data files.
 */
@Injectable()
@Command({
  name: "dictionary",
  description:
    "Process ingested Wiktionary HTML into structured dictionary lexemes",
})
export class DictionaryCommand extends CommandRunner {
  constructor(
    private readonly dictionaryService: DictionaryService,
    private readonly manualService: ManualService,
  ) {
    super();
  }

  /** Parses the `-w, --word` option; returns the word string to ingest. */
  @Option({
    flags: "-w, --word [word]",
    description: "Ingest a single word lexeme",
  })
  parseWord(val: string): string {
    return val;
  }

  /** Runs the dictionary ingestion for a single word when `--word` is given,
   * or processes all cached Wiktionary HTML files otherwise. */
  async run(_args: string[], options: DictionaryCommandOptions): Promise<void> {
    if (options.word) {
      await this.dictionaryService.ingestLexeme(options.word);
    } else {
      await this.dictionaryService.ingestAll();
      await this.manualService.ingestManual();
    }
  }
}
