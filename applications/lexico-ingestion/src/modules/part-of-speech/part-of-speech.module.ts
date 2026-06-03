import { Module } from "@nestjs/common";

import { PartOfSpeechService } from "./part-of-speech.service";

/**
 * TODO: Document the partOfSpeech module.
 */
@Module({
  controllers: [],
  exports: [PartOfSpeechService],
  imports: [],
  providers: [PartOfSpeechService],
})
export class PartOfSpeechModule {}
