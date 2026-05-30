import { Logger } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";

import { TranslationReferencesService } from "./translationReferences.service.js";

/**
 * CLI command: `lexico-ingestion translation-references`
 * Resolves \{*reference*\} markers in translation text.
 */
@Command({
  name: "translation-references",
  description: "Resolve translation reference markers in dictionary entries",
})
export class TranslationReferencesCommand extends CommandRunner {
  private readonly logger = new Logger(TranslationReferencesCommand.name);

  constructor(
    private readonly translationReferencesService: TranslationReferencesService,
  ) {
    super();
  }

  /**
   *
   */
  async run(): Promise<void> {
    this.logger.log("Running translation-references command");
    await this.translationReferencesService.ingestTranslationReferences();
  }
}
