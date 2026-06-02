import fs from "node:fs";
import path from "node:path";

import {
  Form,
  Lexeme,
  Word,
  WordForm,
  WordLexeme,
} from "@monorepo/lexico-entities";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { LexemesService } from "../lexemes/lexemes.service.js";
import { LEXICO_INGESTION_BY_ID } from "../lexico-ingestion/lexico-ingestion.constants.js";
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
    @InjectRepository(Form)
    private readonly formRepository: Repository<Form>,
    @InjectRepository(Word)
    private readonly wordRepository: Repository<Word>,
    @InjectRepository(WordLexeme)
    private readonly wordLexemeRepository: Repository<WordLexeme>,
    @InjectRepository(WordForm)
    private readonly wordFormRepository: Repository<WordForm>,
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
   * and persists them using upsert (idempotent). Loads the cached JSON file if
   * `wiktionaryPage` is not supplied. */
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
      // Upsert the lexeme based on unique constraint (lemma, disambiguator).
      // Explicitly save @ChildEntity inflection first — TypeORM's cascade
      // for STI child entities doesn't reliably set the FK on the parent row.
      if (lexeme.inflection) {
        await lexeme.inflection.save();
      }

      // Use TypeORM's built-in upsert method for idempotent insert/update
      lexeme.createdBy = LEXICO_INGESTION_BY_ID;
      lexeme.updatedBy = LEXICO_INGESTION_BY_ID;
      await this.lexemeRepository.upsert(lexeme, {
        conflictPaths: ["lemma", "disambiguator"],
        skipUpdateIfNoValuesChanged: false,
      });

      // Fetch the upserted lexeme with all relations for relation management
      const savedLexeme = await this.lexemeRepository.findOne({
        where: {
          lemma: lexeme.lemma,
          disambiguator: lexeme.disambiguator,
        },
        relations: [
          "principalParts",
          "pronunciations",
          "translations",
          "inflection",
        ],
      });

      if (savedLexeme) {
        // Assign new relations — TypeORM diffs against the loaded state and
        // cascade-removes orphaned records in a single save round-trip.
        savedLexeme.principalParts = lexeme.principalParts;
        if (lexeme.pronunciations !== undefined) {
          savedLexeme.pronunciations = lexeme.pronunciations;
        }
        if (lexeme.translations !== undefined) {
          savedLexeme.translations = lexeme.translations;
        }
        await this.lexemeRepository.save(savedLexeme);

        // Save normalized Form entities and their Word join records
        if (lexeme.forms.length > 0) {
          await this.ingestLexemeForms(lexeme.forms, savedLexeme);
        }

        this.logger.debug(
          `Upserted lexeme "${lexeme.lemma}" (disambiguator: ${lexeme.disambiguator})`,
        );
      }
    }
    this.logger.log(`📝 Ingested lexeme "${word}"`);
  }

  /**
   * Saves Form entities for a Lexeme, then upserts Word rows and creates
   * explicit WordLexeme and WordForm junction records.
   *
   * Deletes any Forms previously associated with this Lexeme for idempotency —
   * the `onDelete: "CASCADE"` on WordForm.form means their WordForm rows are
   * removed by the database automatically.
   *
   * Uses batched DB operations: one upsert for all Word rows, one reload to
   * collect their IDs, then two bulk inserts for the junction rows.
   */
  private async ingestLexemeForms(
    forms: Form[],
    savedLexeme: Lexeme,
  ): Promise<void> {
    // Delete existing forms for idempotency (WordForms cascade-delete via FK).
    const existingLexeme = await this.lexemeRepository.findOne({
      where: { id: savedLexeme.id },
      relations: ["forms"],
    });
    if (existingLexeme?.forms.length) {
      await this.formRepository.remove(existingLexeme.forms);
    }

    // Capture rawWords before save — transient field is not persisted.
    const rawWordsPerForm = forms.map((f) => f.rawWords ?? []);
    for (const form of forms) {
      form.lexeme = savedLexeme;
    }

    // Batch-save all forms in a single round-trip.
    const savedForms = await this.formRepository.save(forms);

    // Build a map of normalized word string → set of Forms it belongs to.
    const formsByWord = new Map<string, Set<Form>>();
    for (const [i, savedForm] of savedForms.entries()) {
      const rawWords = rawWordsPerForm[i];
      if (!rawWords) continue;

      for (const wordString of rawWords) {
        const normalized = this.escapeCapitals(
          wordString
            .normalize("NFC")
            .replaceAll(/[\u0300-\u036F]/gu, "")
            .toLowerCase()
            .trim(),
        );
        if (!/^-?[A-Za-z]/.test(normalized)) continue;

        const existing = formsByWord.get(normalized) ?? new Set<Form>();
        existing.add(savedForm);
        formsByWord.set(normalized, existing);
      }
    }

    if (formsByWord.size === 0) return;

    // Upsert all Word rows — insert new ones, skip update if unchanged.
    const allNormalizedWords = [...formsByWord.keys()];
    await this.wordRepository.upsert(
      allNormalizedWords.map((w) => ({
        word: w,
        createdBy: LEXICO_INGESTION_BY_ID,
        updatedBy: LEXICO_INGESTION_BY_ID,
      })),
      { conflictPaths: ["word"], skipUpdateIfNoValuesChanged: true },
    );

    // Reload all word IDs in a single query.
    const savedWords = await this.wordRepository.find({
      where: { word: In(allNormalizedWords) },
    });
    const wordMap = new Map(savedWords.map((w) => [w.word, w]));

    // Build WordLexeme junction records — one per word/lexeme pair.
    const wordLexemeValues = savedWords.map((word) => ({
      word,
      lexeme: savedLexeme,
      createdBy: LEXICO_INGESTION_BY_ID,
      updatedBy: LEXICO_INGESTION_BY_ID,
    }));

    // Build WordForm junction records — one per word/form pair.
    const wordFormValues: Partial<WordForm>[] = [];
    for (const [normalized, formSet] of formsByWord) {
      const word = wordMap.get(normalized);
      if (!word) continue;
      for (const form of formSet) {
        wordFormValues.push({
          word,
          form,
          createdBy: LEXICO_INGESTION_BY_ID,
          updatedBy: LEXICO_INGESTION_BY_ID,
        });
      }
    }

    // Insert WordLexeme rows — ON CONFLICT DO NOTHING for idempotency since a
    // word may already be linked to this lexeme from a previous ingestion run.
    if (wordLexemeValues.length > 0) {
      await this.wordLexemeRepository
        .createQueryBuilder()
        .insert()
        .into(WordLexeme)
        .values(wordLexemeValues)
        .orIgnore()
        .execute();
    }

    // Insert WordForm rows — forms are freshly created above so no conflicts.
    if (wordFormValues.length > 0) {
      await this.wordFormRepository.save(wordFormValues);
    }
  }

  private escapeCapitals(word: string): string {
    return word.replaceAll(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
  }
}
