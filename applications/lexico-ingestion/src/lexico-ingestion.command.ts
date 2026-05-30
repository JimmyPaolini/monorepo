import { Injectable } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";

import { ClearCommand } from "./modules/clear/clear.command.js";
import { DictionaryCommand } from "./modules/dictionary/dictionary.command.js";
import { ManualCommand } from "./modules/manual/manual.command.js";
import { TranslationReferencesCommand } from "./modules/translationReferences/translationReferences.command.js";
import { WiktionaryCommand } from "./modules/wiktionary/wiktionary.command.js";
import { WordsCommand } from "./modules/words/words.command.js";

/**
 * Root CLI entry point for lexico-ingestion.
 * Sub-commands: wiktionary, dictionary, words, translation-references, manual, clear
 */
@Injectable()
@Command({
  name: "lexico-ingestion",
  description:
    "Ingest Wiktionary Latin entries and dictionary data into PostgreSQL",
  subCommands: [
    WiktionaryCommand,
    DictionaryCommand,
    WordsCommand,
    TranslationReferencesCommand,
    ManualCommand,
    ClearCommand,
  ],
})
export class LexicoIngestionCommand extends CommandRunner {
  /**
   *
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  async run(): Promise<void> {
    console.log(
      "Use a sub-command: wiktionary | dictionary | words | translation-references | manual | clear",
    );
  }
}
