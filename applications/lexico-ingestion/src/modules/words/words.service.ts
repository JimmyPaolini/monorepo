import {
  Form,
  Lexeme,
  Word,
  WordForm,
  WordLexeme,
} from "@monorepo/lexico-entities";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { LEXICO_INGESTION_BY_ID } from "../lexico-ingestion/lexico-ingestion.constants";

/**
 * Ingests Word search records from all dictionary lexemes.
 */
@Injectable()
export class WordsService {
  private readonly logger = new Logger(WordsService.name);

  // 🏗 Dependency Injection
  constructor(
    @InjectRepository(Word)
    private readonly wordsRepository: Repository<Word>,
    @InjectRepository(WordLexeme)
    private readonly wordLexemeRepository: Repository<WordLexeme>,
    @InjectRepository(WordForm)
    private readonly wordFormRepository: Repository<WordForm>,
  ) {}

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

  /** Generates and persists a `Word` row for every inflected form and
   * principal part that belongs to the given `Lexeme`.
   * Upserts rows in bulk and creates junction records to avoid N+1 queries. */
  async ingestLexemeWords(lexeme: Lexeme): Promise<void> {
    this.logger.log(`🔤 Ingesting words for "${lexeme.id}"`);

    const wordStrings = this.getLexemeWords(lexeme);
    const normalizedWords = [
      ...new Set(
        wordStrings
          .map((w) => this.escapeCapitals(this.normalize(w)))
          .filter((w) => /^-?[A-Za-z]/.test(w)),
      ),
    ];

    if (normalizedWords.length > 0) {
      // Upsert all Word rows by their unique word strings.
      await this.wordsRepository.upsert(
        normalizedWords.map((word) => ({ word })),
        {
          conflictPaths: ["word"],
          skipUpdateIfNoValuesChanged: true,
        },
      );

      // Fetch the inserted words to get their IDs for the junction table
      const words = await this.wordsRepository.find({
        where: { word: In(normalizedWords) },
      });

      // Insert WordLexeme junction rows — ignore if the pair already exists.
      if (words.length > 0) {
        await this.wordLexemeRepository
          .createQueryBuilder()
          .insert()
          .into(WordLexeme)
          .values(words.map((word) => ({ word, lexeme })))
          .orIgnore()
          .execute();
      }
    }

    this.logger.log(`🔤 Ingested words for "${lexeme.id}"`);
  }

  private escapeCapitals(word: string): string {
    return word.replaceAll(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
  }

  private normalize(str: string): string {
    return str
      .normalize("NFD")
      .replaceAll(/[\u0300-\u036F]/gu, "")
      .toLowerCase()
      .trim();
  }

  /** Returns all searchable word strings for a lexeme — the text of each
   * principal part. Form-based words are ingested separately via DictionaryService. */
  getLexemeWords(lexeme: Lexeme): string[] {
    const words: string[] = [];
    lexeme.principalParts.forEach((pp) => words.push(...pp.text));
    return words;
  }

  /** Upserts an array of normalized word strings into the `Word` table, then
   * ensures they are linked to the provided `Lexeme` via `WordLexeme` and to the Form via `WordForm` junctions. */
  async upsertWordsAndJunctions(
    formsByWord: Map<string, Set<Form>>,
    lexeme: Lexeme,
  ): Promise<void> {
    const normalizedWords = [...formsByWord.keys()];
    if (normalizedWords.length === 0) return;

    await this.wordsRepository.upsert(
      normalizedWords.map((w) => ({
        word: w,
        createdBy: LEXICO_INGESTION_BY_ID,
        updatedBy: LEXICO_INGESTION_BY_ID,
      })),
      { conflictPaths: ["word"], skipUpdateIfNoValuesChanged: true },
    );

    const words = await this.wordsRepository.find({
      where: { word: In(normalizedWords) },
    });

    const wordMap = new Map(words.map((w) => [w.word, w]));

    const wordLexemeValues = words.map((word) => ({
      word,
      lexeme,
      createdBy: LEXICO_INGESTION_BY_ID,
      updatedBy: LEXICO_INGESTION_BY_ID,
    }));

    if (wordLexemeValues.length > 0) {
      await this.wordLexemeRepository
        .createQueryBuilder()
        .insert()
        .into(WordLexeme)
        .values(wordLexemeValues)
        .orIgnore()
        .execute();
    }

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

    if (wordFormValues.length > 0) {
      await this.wordFormRepository.save(wordFormValues);
    }
  }
}
