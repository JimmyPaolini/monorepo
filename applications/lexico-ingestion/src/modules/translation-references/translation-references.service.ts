import { Lexeme, Translation } from "@monorepo/lexico-entities";
import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Like, Repository } from "typeorm";

/**
 * Resolves \{*reference*\} markers in translation text by linking to the
 * referenced lexeme's translations.
 */
@Injectable()
export class TranslationReferencesService {
  private readonly logger = new Logger(TranslationReferencesService.name);

  // 🏗️ Dependency Injection
  constructor(
    @InjectRepository(Lexeme)
    private readonly lexemesRepository: Repository<Lexeme>,
    @InjectRepository(Translation)
    private readonly translationsRepository: Repository<Translation>,
  ) {}

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

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
}
