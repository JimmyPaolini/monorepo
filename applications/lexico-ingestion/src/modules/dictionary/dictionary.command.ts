import { Injectable } from "@nestjs/common";
import { Command, CommandRunner, Option } from "nest-commander";

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
    "Process ingested Wiktionary HTML into structured dictionary entries",
})
export class DictionaryCommand extends CommandRunner {
  constructor(private readonly dictionaryService: DictionaryService) {
    super();
  }

  @Option({
    flags: "-w, --word [word]",
    description: "Ingest a single word entry",
  })
  parseWord(val: string): string {
    return val;
  }

  async run(_args: string[], options: DictionaryCommandOptions): Promise<void> {
    if (options.word) {
      await this.dictionaryService.ingestEntry(options.word);
    } else {
      await this.dictionaryService.ingestAll();
    }
  }
}
