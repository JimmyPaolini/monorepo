import fs from "node:fs";
import path from "node:path";

import { Lexeme, Translation } from "@monorepo/lexico-entities";
import { Injectable } from "@nestjs/common";

import { LexemesService } from "../lexemes/lexemes.service";
import { LoggerService } from "../logger/logger.service";
import { TranslationsService } from "../translations/translations.service";

import type { WiktionaryPage } from "../lexico-ingestion/lexico-ingestion.types";

/**
 * TODO: Document the dictionary service.
 */
@Injectable()
export class DictionaryService {
  // 🏗️ Dependency Injection
  constructor(
    private readonly lexemesService: LexemesService,
    private readonly translationsService: TranslationsService,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(DictionaryService.name);
  }

  // 🔐 Private Fields
  private readonly dataDir = path.join(process.cwd(), "./data/wiktionary");
  private readonly inProgressWords = new Set<string>();
  private fileIndex: Map<string, string> | null = null;

  // 🔑 Public Fields

  // 🔏 Private Methods

  private readWiktionaryPage(filePath: string): WiktionaryPage | null {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as WiktionaryPage;
  }

  // 🌎 Public Methods

  /** Reads all cached Wiktionary JSON files from `./data/wiktionary`,
   * parses each into structured `Entry` records, and saves them to the database. */
  async ingestAll(startLemma?: string, endLemma?: string): Promise<void> {
    if (!fs.existsSync(this.dataDir)) {
      this.logger.warn(
        `Data directory not found: ${this.dataDir}. Run 'wiktionary' command first.`,
      );
      return;
    }

    let files = fs.readdirSync(this.dataDir).filter((f) => f.endsWith(".json"));

    if (startLemma || endLemma) {
      const startIndex = startLemma
        ? files.findIndex((f) => f.replace(".json", "") === startLemma)
        : 0;
      const endIndex = endLemma
        ? files.findIndex((f) => f.replace(".json", "") === endLemma)
        : files.length - 1;

      const start = Math.max(0, startIndex);
      const end = endIndex === -1 ? files.length - 1 : endIndex;

      files = files.slice(start, end + 1);
    }

    this.logger.log(`📖 Processing ${files.length} lexemes`);

    let current = 0;
    const total = files.length;

    for (const file of files) {
      current++;
      try {
        const filePath = path.join(this.dataDir, file);
        const wiktionaryPage = this.readWiktionaryPage(filePath);
        if (!wiktionaryPage) continue;
        await this.ingestLexeme(wiktionaryPage.word, wiktionaryPage, {
          current,
          total,
        });
      } catch (error) {
        this.logger.error(`Failed to process ${file}: ${String(error)}`);
      }
    }

    this.logger.log("📖 Dictionary ingestion complete");
  }

  private getFilePathForWord(word: string): string | null {
    const fileWord = word.normalize("NFD").replaceAll(/[\u0300-\u036F]/gu, "");

    // Exact match
    const p = path.join(this.dataDir, `${this.escapeCapitals(fileWord)}.json`);
    if (fs.existsSync(p)) return p;

    // Build the case-insensitive index on first miss
    if (this.fileIndex === null) {
      this.fileIndex = new Map();
      if (fs.existsSync(this.dataDir)) {
        for (const file of fs.readdirSync(this.dataDir)) {
          if (!file.endsWith(".json")) continue;
          // Reverse escapeCapitals: Remove all '_' and lowercase the string
          const normalized = file.replaceAll("_", "").toLowerCase();
          this.fileIndex.set(normalized, file);
        }
      }
    }

    const fallbackFileName = this.fileIndex.get(
      `${fileWord.toLowerCase()}.json`,
    );
    if (fallbackFileName) {
      return path.join(this.dataDir, fallbackFileName);
    }

    return null;
  }

  private loadWiktionaryPageForWord(word: string): WiktionaryPage | null {
    const filePath = this.getFilePathForWord(word);
    if (!filePath) {
      this.logger.warn(`No data file found for word: ${word}`);
      return null;
    }
    const page = this.readWiktionaryPage(filePath);
    if (!page) {
      this.logger.warn(`No data file found for word: ${word}`);
      return null;
    }
    return page;
  }

  private normalize(str: string): string {
    return str
      .normalize("NFD")
      .replaceAll(/[\u0300-\u036F]/gu, "")
      .toLowerCase()
      .trim();
  }

  private async ingestTranslationReference(
    translation: Translation,
  ): Promise<void> {
    const matches = [...translation.translation.matchAll(/\{\*(.+?)\*\}/g)];
    if (matches.length === 0) {
      this.logger.warn(`No reference found in: ${translation.translation}`);
      return;
    }

    const newTranslations: Translation[] = [];

    for (const match of matches) {
      let reference = match[1] ?? "";
      if (/\(.*\)/.test(reference))
        reference = reference.replace(/ ?\(.*\)/, "");

      const lexemes =
        await this.lexemesService.findLexemesByLemmaWithTranslations(
          this.normalize(reference),
        );

      const lexeme =
        lexemes.find(
          (e) => e.partOfSpeech === translation.lexeme.partOfSpeech,
        ) ?? lexemes[0];

      if (!lexeme) {
        this.logger.warn(`No lexeme found for reference: ${reference}`);
        continue;
      }

      const mapped = (lexeme.translations ?? []).map(
        (t) => new Translation(t.translation, translation.lexeme),
      );
      newTranslations.push(...mapped);
    }

    if (newTranslations.length > 0) {
      await this.translationsService.saveTranslations(newTranslations);
    }

    translation.translation = translation.translation
      .replaceAll(/\{\*(.+?)\*\}/g, "")
      .trim();
    await this.translationsService.saveTranslations([translation]);
  }

  private async processTranslationReferences(saved: Lexeme): Promise<void> {
    const referencedWords =
      this.translationsService.extractTranslationReferences(
        saved.translations ?? [],
      );
    for (const refWord of referencedWords) {
      if (!this.inProgressWords.has(refWord)) {
        const refExists = await this.lexemesService.existsByLemma(refWord);
        if (!refExists) {
          await this.ingestLexeme(refWord);
        }
      }
    }

    const translations =
      await this.translationsService.findTranslationsWithReferences(saved.id);
    for (const translation of translations) {
      await this.ingestTranslationReference(translation);
    }
  }

  /** Parses the Wiktionary HTML for `word` into one or more `Lexeme` records
   * and persists them using upsert (idempotent). Loads the cached JSON file if
   * `wiktionaryPage` is not supplied. */
  async ingestLexeme(
    word: string,
    wiktionaryPage?: WiktionaryPage,
    progress?: { current: number; total: number },
  ): Promise<void> {
    this.inProgressWords.add(word);
    try {
      if (!wiktionaryPage) {
        const page = this.loadWiktionaryPageForWord(word);
        if (!page) return;
        wiktionaryPage = page;
      }

      if (!wiktionaryPage.html) {
        this.logger.warn(`No HTML for word: ${word}`);
        return;
      }

      const progressString = progress
        ? ` (${((progress.current / progress.total) * 100).toFixed(2)}%, ${progress.current}/${progress.total})`
        : "";

      this.logger.log(`📝 Ingesting lexeme "${word}"${progressString}`);
      const parsedLexemes =
        await this.lexemesService.parseLexemes(wiktionaryPage);
      for (const lexeme of parsedLexemes) {
        const saved = await this.lexemesService.saveParsedLexeme(lexeme);
        if (!saved) continue;

        await this.processTranslationReferences(saved);
      }
      this.logger.log(`📝 Ingested lexeme "${word}"${progressString}`);
    } finally {
      this.inProgressWords.delete(word);
    }
  }

  private escapeCapitals(word: string): string {
    return word.replaceAll(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
  }
}
