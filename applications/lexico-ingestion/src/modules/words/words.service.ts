import { Lexeme, Word, WordLexeme } from "@monorepo/lexico-entities";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

/**
 * Ingests Word search records from all dictionary lexemes.
 */
@Injectable()
export class WordsService {
  private readonly logger = new Logger(WordsService.name);

  // 🏗️ Dependency Injection
  constructor(
    @InjectRepository(Word)
    private readonly wordsRepository: Repository<Word>,
    @InjectRepository(WordLexeme)
    private readonly wordLexemeRepository: Repository<WordLexeme>,
  ) {}

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

  /** Generates and persists a `Word` row for every inflected form and
   * principal part that belongs to the given `Lexeme`. */
  async ingestLexemeWords(lexeme: Lexeme): Promise<void> {
    this.logger.log(`🔤 Ingesting words for "${lexeme.id}"`);
    for (const word of this.getLexemeWords(lexeme)) {
      await this.ingestLexemeWord(word, lexeme);
    }
    this.logger.log(`🔤 Ingested words for "${lexeme.id}"`);
  }

  private escapeCapitals(word: string): string {
    return word.replaceAll(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
  }

  private normalize(str: string): string {
    return str
      .normalize("NFC")
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

  /** Normalises `wordString` and upserts a `Word` row linked to `lexeme`
   * via an explicit WordLexeme junction record.
   * Skips strings that do not start with an ASCII letter after normalisation. */
  async ingestLexemeWord(wordString: string, lexeme: Lexeme): Promise<void> {
    const normalized = this.escapeCapitals(this.normalize(wordString));
    if (!/^-?[A-Za-z]/.test(normalized)) return;

    // Upsert the Word row by its unique word string.
    await this.wordsRepository.upsert(
      { word: normalized },
      {
        conflictPaths: ["word"],
        skipUpdateIfNoValuesChanged: true,
      },
    );

    const word = await this.wordsRepository.findOneOrFail({
      where: { word: normalized },
    });

    // Insert a WordLexeme junction row — ignore if the pair already exists.
    await this.wordLexemeRepository
      .createQueryBuilder()
      .insert()
      .into(WordLexeme)
      .values({ word, lexeme })
      .orIgnore()
      .execute();
  }
}
