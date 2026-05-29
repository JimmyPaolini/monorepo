import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Entry, Word, Translation } from '@monorepo/lexico-entities';
import { Repository } from 'typeorm';
import fs from 'node:fs';
import path from 'node:path';

import { IngesterService } from './ingester.service.js';
import type { WiktionaryEntry } from '../../lexico-ingestion.types.js';

@Injectable()
export class DictionaryService {
  private readonly logger = new Logger(DictionaryService.name);
  private readonly dataDir = path.join(process.cwd(), './data/wiktionary');

  constructor(
    @InjectRepository(Entry)
    private readonly entryRepository: Repository<Entry>,
    @InjectRepository(Word)
    private readonly wordRepository: Repository<Word>,
    @InjectRepository(Translation)
    private readonly translationRepository: Repository<Translation>,
    private readonly ingesterService: IngesterService,
  ) {}

  async ingestAll(): Promise<void> {
    if (!fs.existsSync(this.dataDir)) {
      this.logger.warn(`Data directory not found: ${this.dataDir}. Run 'wiktionary' command first.`);
      return;
    }

    const files = fs.readdirSync(this.dataDir).filter((f) => f.endsWith('.json'));
    this.logger.log(`Processing ${files.length} entries...`);

    for (const file of files) {
      try {
        const filePath = path.join(this.dataDir, file);
        const raw = fs.readFileSync(filePath, 'utf-8');
        const wiktionaryEntry = JSON.parse(raw) as WiktionaryEntry;
        await this.ingestEntry(wiktionaryEntry.word, wiktionaryEntry);
      } catch (error) {
        this.logger.error(`Failed to process ${file}: ${String(error)}`);
      }
    }

    this.logger.log('Dictionary ingestion complete.');
  }

  async ingestEntry(word: string, wiktionaryEntry?: WiktionaryEntry): Promise<void> {
    if (!wiktionaryEntry) {
      const filePath = path.join(this.dataDir, `${this.escapeCapitals(word)}.json`);
      if (!fs.existsSync(filePath)) {
        this.logger.warn(`No data file found for word: ${word}`);
        return;
      }
      const raw = fs.readFileSync(filePath, 'utf-8');
      wiktionaryEntry = JSON.parse(raw) as WiktionaryEntry;
    }

    if (!wiktionaryEntry.html) {
      this.logger.warn(`No HTML for word: ${word}`);
      return;
    }

    const parsedEntries = await this.ingesterService.parseEntries(wiktionaryEntry);
    for (const entry of parsedEntries) {
      await this.entryRepository.save(entry);
    }
  }

  private escapeCapitals(word: string): string {
    return word.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
  }
}
