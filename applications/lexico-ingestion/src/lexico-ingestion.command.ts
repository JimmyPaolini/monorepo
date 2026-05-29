import { Injectable } from '@nestjs/common';
import { Command, CommandRunner } from 'nest-commander';

import { WiktionaryCommand } from './modules/wiktionary/wiktionary.command.js';
import { DictionaryCommand } from './modules/dictionary/dictionary.command.js';

/**
 * Root CLI entry point for lexico-ingestion.
 * Sub-commands: wiktionary, dictionary
 */
@Injectable()
@Command({
  name: 'lexico-ingestion',
  description: 'Ingest Wiktionary Latin entries and dictionary data into PostgreSQL',
  subCommands: [WiktionaryCommand, DictionaryCommand],
})
export class LexicoIngestionCommand extends CommandRunner {
  async run(): Promise<void> {
    console.log('Use a sub-command: wiktionary | dictionary');
  }
}
