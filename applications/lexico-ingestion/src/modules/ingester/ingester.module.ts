import { Module } from "@nestjs/common";

import { PartOfSpeechModule } from "../partOfSpeech/partOfSpeech.module.js";
import { PronunciationModule } from "../pronunciation/pronunciation.module.js";

import { IngesterService } from "./ingester.service.js";

/**
 * Wires POS detection, pronunciation parsing, and full Wiktionary entry
 * orchestration into a single injectable module.
 */
@Module({
  controllers: [],
  exports: [IngesterService],
  imports: [PartOfSpeechModule, PronunciationModule],
  providers: [IngesterService],
})
export class IngesterModule {}
