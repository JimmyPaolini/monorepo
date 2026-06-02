import fs from "node:fs";
import path from "node:path";

import { Lexeme } from "@monorepo/lexico-entities";
import { Injectable } from "@nestjs/common";

import { FormsService } from "../forms/forms.service.js";
import { LexemesService } from "../lexemes/lexemes.service.js";
import { LoggerService } from "../logger/logger.service.js";
import { PrincipalPartsService } from "../principal-parts/principal-parts.service.js";
import { PronunciationService } from "../pronunciation/pronunciation.service.js";
import { TranslationsService } from "../translations/translations.service.js";
import { WordsService } from "../words/words.service.js";

import type { WiktionaryPage } from "../lexico-ingestion/lexico-ingestion.types.js";

/**
 * TODO: Document the dictionary service.
 */
@Injectable()
export class DictionaryService {
  // 🏗️ Dependency Injection
  constructor(
    private readonly formsService: FormsService,
    private readonly lexemesService: LexemesService,
    private readonly principalPartsService: PrincipalPartsService,
    private readonly pronunciationService: PronunciationService,
    private readonly translationsService: TranslationsService,
    private readonly wordsService: WordsService,
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

  private async persistLexeme(lexeme: Lexeme): Promise<Lexeme | null> {
    await this.lexemesService.upsertLexeme(lexeme);
    const savedLexeme = await this.lexemesService.fetchSavedLexeme(
      lexeme.lemma,
      lexeme.disambiguator,
    );
    if (!savedLexeme) return null;

    await this.principalPartsService.ingestLexemePrincipalParts(
      savedLexeme,
      lexeme.principalParts,
    );
    if (lexeme.pronunciations !== undefined && lexeme.pronunciations !== null) {
      await this.pronunciationService.ingestLexemePronunciations(
        savedLexeme,
        lexeme.pronunciations,
      );
    }
    if (lexeme.translations !== undefined && lexeme.translations !== null) {
      await this.translationsService.ingestTranslations(
        savedLexeme,
        lexeme.translations,
      );
    }
    if (lexeme.forms.length > 0) {
      await this.formsService.ingestLexemeForms(lexeme.forms, savedLexeme);
    }
    await this.wordsService.ingestLexemeWords(savedLexeme);
    this.logger.debug(
      `Upserted lexeme "${lexeme.lemma}" (disambiguator: ${lexeme.disambiguator})`,
    );
    return savedLexeme;
  }

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
        const filePath = this.getFilePathForWord(word);
        if (!filePath) {
          this.logger.warn(`No data file found for word: ${word}`);
          return;
        }
        const page = this.readWiktionaryPage(filePath);
        if (!page) {
          this.logger.warn(`No data file found for word: ${word}`);
          return;
        }
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
        const saved = await this.persistLexeme(lexeme);
        if (!saved) continue;

        const referencedWords =
          this.translationsService.extractTranslationReferences(
            saved.translations ?? [],
          );
        for (const refWord of referencedWords) {
          if (!this.inProgressWords.has(refWord)) {
            const refExists =
              await this.translationsService.lexemeExistsInDb(refWord);
            if (!refExists) {
              await this.ingestLexeme(refWord);
            }
          }
        }

        await this.translationsService.ingestTranslationReferencesForLexeme(
          saved.id,
        );
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
