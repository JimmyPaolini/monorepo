import fs from "node:fs";
import path from "node:path";

import { Entry } from "@monorepo/lexico-entities";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { IngesterService } from "../ingester/ingester.service.js";

import type { WiktionaryEntry } from "../lexico-ingestion/lexico-ingestion.types.js";

/**
 * TODO: Document the dictionary service.
 */
@Injectable()
export class DictionaryService {
  // 🏗️ Dependency Injection
  constructor(
    @InjectRepository(Entry)
    private readonly entryRepository: Repository<Entry>,
    private readonly ingesterService: IngesterService,
  ) {}

  // 🔐 Private Fields
  private readonly logger = new Logger(DictionaryService.name);
  private readonly dataDir = path.join(process.cwd(), "./data/wiktionary");

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

  /** Reads all cached Wiktionary JSON files from `./data/wiktionary`,
   * parses each into structured `Entry` records, and saves them to the database. */
  async ingestAll(): Promise<void> {
    if (!fs.existsSync(this.dataDir)) {
      this.logger.warn(
        `Data directory not found: ${this.dataDir}. Run 'wiktionary' command first.`,
      );
      return;
    }

    const files = fs
      .readdirSync(this.dataDir)
      .filter((f) => f.endsWith(".json"));
    this.logger.log(`Processing ${files.length} entries...`);

    for (const file of files) {
      try {
        const filePath = path.join(this.dataDir, file);
        const raw = fs.readFileSync(filePath, "utf8");
        const wiktionaryEntry = JSON.parse(raw) as WiktionaryEntry;
        await this.ingestEntry(wiktionaryEntry.word, wiktionaryEntry);
      } catch (error) {
        this.logger.error(`Failed to process ${file}: ${String(error)}`);
      }
    }

    this.logger.log("Dictionary ingestion complete.");
  }

  /** Parses the Wiktionary HTML for `word` into one or more `Entry` records
   * and persists them. Loads the cached JSON file if `wiktionaryEntry` is
   * not supplied. */
  async ingestEntry(
    word: string,
    wiktionaryEntry?: WiktionaryEntry,
  ): Promise<void> {
    if (!wiktionaryEntry) {
      const filePath = path.join(
        this.dataDir,
        `${this.escapeCapitals(word)}.json`,
      );
      if (!fs.existsSync(filePath)) {
        this.logger.warn(`No data file found for word: ${word}`);
        return;
      }
      const raw = fs.readFileSync(filePath, "utf8");
      wiktionaryEntry = JSON.parse(raw) as WiktionaryEntry;
    }

    if (!wiktionaryEntry.html) {
      this.logger.warn(`No HTML for word: ${word}`);
      return;
    }

    const parsedEntries =
      await this.ingesterService.parseEntries(wiktionaryEntry);
    for (const entry of parsedEntries) {
      await this.entryRepository.save(entry);
    }
  }

  private escapeCapitals(word: string): string {
    return word.replaceAll(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
  }
}
