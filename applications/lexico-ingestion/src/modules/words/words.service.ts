import { Lexeme, Word } from "@monorepo/lexico-entities";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/**
 * Ingests Word search records from all dictionary lexemes.
 */
@Injectable()
export class WordsService {
  private readonly logger = new Logger(WordsService.name);

  // 🏗️ Dependency Injection
  constructor(
    @InjectRepository(Lexeme)
    private readonly lexemesRepository: Repository<Lexeme>,
    @InjectRepository(Word)
    private readonly wordsRepository: Repository<Word>,
  ) {}

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

  /** Ingests `Word` search records for every `Lexeme` in the database,
   * processing lexemes in batches of 100 to keep memory usage bounded. */
  async ingestWords(): Promise<void> {
    this.logger.log("🔤 Ingesting words");
    const batchSize = 100;
    let skip = 0;
    let batch: Lexeme[];

    do {
      batch = await this.lexemesRepository.find({
        relations: ["principalParts", "forms"],
        order: { id: "ASC" },
        take: batchSize,
        skip,
      });
      this.logger.log(
        `🔤 Processing batch at offset ${skip} (${batch.length} lexemes)`,
      );
      for (const lexeme of batch) {
        await this.ingestLexemeWords(lexeme);
      }
      skip += batchSize;
    } while (batch.length === batchSize);

    this.logger.log("🔤 Ingested words");
  }

  /** Generates and persists a `Word` row for every inflected form and
   * principal part that belongs to the given `Lexeme`. */
  async ingestLexemeWords(lexeme: Lexeme): Promise<void> {
    this.logger.log(`🔤 Ingesting words for "${lexeme.id}"`);
    for (const word of this.getLexemeWords(lexeme)) {
      await this.ingestLexemeWord(word, lexeme);
    }
    this.logger.log(`🔤 Ingested words for "${lexeme.id}"`);
  }

  private flattenForms(obj: unknown): string[] {
    if (!obj) return [];
    if (isUnknownArray(obj))
      return obj.filter((v): v is string => typeof v === "string");
    if (isRecord(obj)) {
      return Object.values(obj).flatMap((val) => this.flattenForms(val));
    }
    return [];
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

  /** Returns all searchable word strings for a lexeme — every form value
   * extracted by flattening the `forms` JSON object plus each principal-part text. */
  getLexemeWords(lexeme: Lexeme): string[] {
    const forms = this.flattenForms(lexeme.forms);
    lexeme.principalParts.forEach((pp) => forms.push(...pp.text));
    return forms;
  }

  /** Normalises `wordString` and upserts a `Word` row linked to `lexeme`.
   * Skips strings that do not start with an ASCII letter after normalisation. */
  async ingestLexemeWord(wordString: string, lexeme: Lexeme): Promise<void> {
    const normalized = this.escapeCapitals(this.normalize(wordString));
    if (!/^-?[A-Za-z]/.test(normalized)) return;

    const existingWord = await this.wordsRepository.findOne({
      where: { word: normalized },
      relations: ["lexemes"],
    });

    if (existingWord) {
      if (!existingWord.lexemes.some((e) => e.id === lexeme.id)) {
        existingWord.lexemes.push(lexeme);
        await this.wordsRepository.save(existingWord);
      }
    } else {
      await this.wordsRepository.save({ word: normalized, lexemes: [lexeme] });
    }
  }
}
