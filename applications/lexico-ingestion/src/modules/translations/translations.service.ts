import { Lexeme, Translation } from "@monorepo/lexico-entities";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Like, Repository } from "typeorm";

import { LoggerService } from "../logger/logger.service.js";

/**
 * Persists Translation entities for a Lexeme and resolves cross-reference
 * markers embedded in translation text.
 */
@Injectable()
export class TranslationsService {
  // 🏗️ Dependency Injection
  constructor(
    @InjectRepository(Lexeme)
    private readonly lexemesRepository: Repository<Lexeme>,
    @InjectRepository(Translation)
    private readonly translationsRepository: Repository<Translation>,
    private readonly logger: LoggerService,
  ) {
    this.logger.setContext(TranslationsService.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  private escapeCapitals(word: string): string {
    return word.replaceAll(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
  }

  private async ingestTranslationReference(
    translation: Translation,
  ): Promise<void> {
    const match = /\{\*.+\*\}/.exec(translation.translation);
    if (!match?.[0]) {
      this.logger.warn(`No reference found in: ${translation.translation}`);
      return;
    }

    let reference = match[0].slice(2, -2);
    if (/\(.*\)/.test(reference)) reference = reference.replace(/ ?\(.*\)/, "");

    const lexemes = await this.lexemesRepository
      .createQueryBuilder("lexeme")
      .leftJoinAndSelect("lexeme.translations", "translations")
      .where(`lexeme.id ~* :pattern`, {
        pattern: String.raw`${this.escapeCapitals(reference)}:\d`,
      })
      .getMany();

    const lexeme =
      lexemes.find((e) => e.partOfSpeech === translation.lexeme.partOfSpeech) ??
      lexemes[0];

    if (!lexeme) {
      this.logger.warn(`No lexeme found for reference: ${reference}`);
    }

    const newTranslations = (lexeme?.translations ?? []).map(
      (t) => new Translation(t.translation, translation.lexeme),
    );

    if (newTranslations.length > 0) {
      await this.translationsRepository.save(newTranslations);
    }

    translation.translation = translation.translation
      .replaceAll(/\{\*.*\*\}/g, "")
      .trim();
    await this.translationsRepository.save(translation);
  }

  // 🌎 Public Methods

  /** Assigns translations onto the saved lexeme and persists via orphan
   * removal — TypeORM diffs the new array against the loaded state and
   * removes stale rows automatically. */
  async ingestTranslations(
    savedLexeme: Lexeme,
    translations: Translation[],
  ): Promise<void> {
    savedLexeme.translations = translations;
    await this.lexemesRepository.save(savedLexeme);
    this.logger.debug(
      `Saved ${translations.length} translations for lexeme "${savedLexeme.lemma}" (disambiguator: ${savedLexeme.disambiguator})`,
    );
  }

  /** Scans translation strings for `{*word*}` cross-reference patterns and
   * returns the unique set of referenced word strings. */
  extractTranslationReferences(translations: Translation[]): string[] {
    const refs: string[] = [];
    for (const t of translations) {
      for (const match of t.translation.matchAll(/\{\*(.+?)\*\}/g)) {
        let ref = match[1] ?? "";
        if (/\(.*\)/.test(ref)) ref = ref.replace(/ ?\(.*\)/, "");
        if (ref) refs.push(ref);
      }
    }
    return [...new Set(refs)];
  }

  /** Returns true if a lexeme matching `reference` already exists in the DB. */
  async lexemeExistsInDb(reference: string): Promise<boolean> {
    const count = await this.lexemesRepository
      .createQueryBuilder("lexeme")
      .where("lexeme.id ~* :pattern", {
        pattern: String.raw`${this.escapeCapitals(reference)}:\d`,
      })
      .getCount();
    return count > 0;
  }

  /** Finds all `Translation` rows for a single lexeme whose text contains
   * `{*...*}` reference markers and resolves each one. */
  async ingestTranslationReferencesForLexeme(lexemeId: string): Promise<void> {
    const translations = await this.translationsRepository.find({
      where: { lexeme: { id: lexemeId }, translation: Like("%{*%*}%") },
      relations: ["lexeme"],
    });
    for (const translation of translations) {
      await this.ingestTranslationReference(translation);
    }
  }

  /** Finds all `Translation` rows whose text contains `{*...*}` reference
   * markers and replaces them with the corresponding entry's translations,
   * repeating until no unresolved references remain. */
  async ingestTranslationReferences(): Promise<void> {
    this.logger.log("🔗 Ingesting translation references");

    const params = {
      where: { translation: Like("%{*%*}%") },
      order: { translation: "ASC" as const },
      relations: ["lexeme"],
      take: 100,
    };

    let translations = await this.translationsRepository.find(params);
    while (translations.length > 0) {
      this.logger.log(
        `🔗 Processing ${translations.length} translations (first: ${translations[0]?.translation ?? ""})`,
      );
      for (const translation of translations) {
        await this.ingestTranslationReference(translation);
      }
      translations = await this.translationsRepository.find(params);
    }

    this.logger.log("🔗 Ingested translation references");
  }
}
