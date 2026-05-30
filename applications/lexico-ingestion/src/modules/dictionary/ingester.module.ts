import { Module } from "@nestjs/common";

import { IngesterService } from "./ingester.service.js";

/**
 * Encapsulates the Wiktionary HTML parsing pipeline.
 */
@Module({
  providers: [IngesterService],
  exports: [IngesterService],
})
export class IngesterModule {}
