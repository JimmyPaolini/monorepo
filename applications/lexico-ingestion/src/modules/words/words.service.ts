import { Entry, Word } from "@monorepo/lexico-entities";
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
 * Ingests Word search records from all dictionary entries.
 */
@Injectable()
export class WordsService {
  private readonly logger = new Logger(WordsService.name);

  // 🏗️ Dependency Injection
  constructor(
    @InjectRepository(Entry)
    private readonly entriesRepository: Repository<Entry>,
    @InjectRepository(Word)
    private readonly wordsRepository: Repository<Word>,
  ) {}

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

  /** Ingests `Word` search records for every `Entry` in the database,
   * processing entries in batches of 100 to keep memory usage bounded. */
  async ingestWords(): Promise<void> {
    this.logger.log("🔤 Ingesting words");
    const batchSize = 100;
    let skip = 0;
    let batch: Entry[];

    do {
      batch = await this.entriesRepository.find({
        relations: ["principalParts", "forms"],
        order: { id: "ASC" },
        take: batchSize,
        skip,
      });
      this.logger.log(
        `🔤 Processing batch at offset ${skip} (${batch.length} entries)`,
      );
      for (const entry of batch) {
        await this.ingestEntryWords(entry);
      }
      skip += batchSize;
    } while (batch.length === batchSize);

    this.logger.log("🔤 Ingested words");
  }

  /** Generates and persists a `Word` row for every inflected form and
   * principal part that belongs to the given `Entry`. */
  async ingestEntryWords(entry: Entry): Promise<void> {
    this.logger.log(`🔤 Ingesting words for "${entry.id}"`);
    for (const word of this.getEntryWords(entry)) {
      await this.ingestEntryWord(word, entry);
    }
    this.logger.log(`🔤 Ingested words for "${entry.id}"`);
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

  /** Returns all searchable word strings for an entry — every form value
   * extracted by flattening the `forms` JSON object plus each principal-part text. */
  getEntryWords(entry: Entry): string[] {
    const forms = this.flattenForms(entry.forms);
    entry.principalParts.forEach((pp) => forms.push(...pp.text));
    return forms;
  }

  /** Normalises `wordString` and upserts a `Word` row linked to `entry`.
   * Skips strings that do not start with an ASCII letter after normalisation. */
  async ingestEntryWord(wordString: string, entry: Entry): Promise<void> {
    const normalized = this.escapeCapitals(this.normalize(wordString));
    if (!/^-?[A-Za-z]/.test(normalized)) return;

    const existingWord = await this.wordsRepository.findOne({
      where: { word: normalized },
      relations: ["entries"],
    });

    if (existingWord) {
      if (!existingWord.entries.some((e) => e.id === entry.id)) {
        existingWord.entries.push(entry);
        await this.wordsRepository.save(existingWord);
      }
    } else {
      await this.wordsRepository.save({ word: normalized, entries: [entry] });
    }
  }
}
