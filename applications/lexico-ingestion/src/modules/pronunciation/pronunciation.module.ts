import { Module } from "@nestjs/common";

import { PronunciationService } from "./pronunciation.service";

/**
 * TODO: Document the pronunciation module.
 */
@Module({
  controllers: [],
  exports: [PronunciationService],
  imports: [],
  providers: [PronunciationService],
})
export class PronunciationModule {}
