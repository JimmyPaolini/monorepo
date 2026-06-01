import fs from "node:fs";
import path from "node:path";

import { Lexeme } from "@monorepo/lexico-entities";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { LexemesService } from "../lexemes/lexemes.service.js";
import { LoggerService } from "../logger/logger.service.js";

import type { WiktionaryPage } from "../lexico-ingestion/lexico-ingestion.types.js";

/**
 * TODO: Document the dictionary service.
 */
@Injectable()
export class DictionaryService {
  // 🏗️ Dependency Injection
  constructor(
    @InjectRepository(Lexeme)
    private readonly lexemeRepository: Repository<Lexeme>,
    private readonly lexemesService: LexemesService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(DictionaryService.name);
  }

  // 🔐 Private Fields
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
    this.logger.log(`📖 Processing ${files.length} lexemes`);

    for (const file of files) {
      try {
        const filePath = path.join(this.dataDir, file);
        const raw = fs.readFileSync(filePath, "utf8");
        const wiktionaryPage = JSON.parse(raw) as WiktionaryPage;
        await this.ingestLexeme(wiktionaryPage.word, wiktionaryPage);
      } catch (error) {
        this.logger.error(`Failed to process ${file}: ${String(error)}`);
      }
    }

    this.logger.log("📖 Dictionary ingestion complete");
  }

  /** Parses the Wiktionary HTML for `word` into one or more `Lexeme` records
   * and persists them. Loads the cached JSON file if `wiktionaryPage` is
   * not supplied. */
  async ingestLexeme(
    word: string,
    wiktionaryPage?: WiktionaryPage,
  ): Promise<void> {
    if (!wiktionaryPage) {
      const filePath = path.join(
        this.dataDir,
        `${this.escapeCapitals(word)}.json`,
      );
      if (!fs.existsSync(filePath)) {
        this.logger.warn(`No data file found for word: ${word}`);
        return;
      }
      const raw = fs.readFileSync(filePath, "utf8");
      wiktionaryPage = JSON.parse(raw) as WiktionaryPage;
    }

    if (!wiktionaryPage.html) {
      this.logger.warn(`No HTML for word: ${word}`);
      return;
    }

    this.logger.log(`📝 Ingesting lexeme "${word}"`);
    const parsedLexemes =
      await this.lexemesService.parseLexemes(wiktionaryPage);
    for (const lexeme of parsedLexemes) {
      // Explicitly save @ChildEntity inflection first — TypeORM's cascade
      // for STI child entities doesn't reliably set the FK on the parent row.
      if (lexeme.inflection) {
        await lexeme.inflection.save();
      }
      await this.lexemeRepository.save(lexeme);
    }
    this.logger.log(`📝 Ingested lexeme "${word}"`);
  }

  private escapeCapitals(word: string): string {
    return word.replaceAll(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
  }
}
