import { Entry, Word } from "@monorepo/lexico-entities";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { flattenForms } from "../dictionary/ingester/utils/forms.js";
import {
  escapeCapitals,
  normalize,
} from "../dictionary/ingester/utils/strings.js";

/**
 * Ingests Word search records from all dictionary entries.
 */
@Injectable()
export class WordsService {
  private readonly logger = new Logger(WordsService.name);

  constructor(
    @InjectRepository(Entry)
    private readonly entriesRepository: Repository<Entry>,
    @InjectRepository(Word)
    private readonly wordsRepository: Repository<Word>,
  ) {}

  /**
   *
   */
  async ingestWords(): Promise<void> {
    this.logger.log("Ingesting words");
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
      for (const entry of batch) {
        await this.ingestEntryWords(entry);
      }
      skip += batchSize;
    } while (batch.length === batchSize);

    this.logger.log("Ingested words");
  }

  /**
   *
   */
  async ingestEntryWords(entry: Entry): Promise<void> {
    for (const word of this.getEntryWords(entry)) {
      await this.ingestEntryWord(word, entry);
    }
  }

  /**
   *
   */
  getEntryWords(entry: Entry): string[] {
    const forms = flattenForms(
      entry.forms as Record<string, unknown> | null | undefined,
    );
    entry.principalParts.forEach((pp) => forms.push(...pp.text));
    return forms;
  }

  /**
   *
   */
  async ingestEntryWord(wordString: string, entry: Entry): Promise<void> {
    const normalized = escapeCapitals(normalize(wordString));
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
