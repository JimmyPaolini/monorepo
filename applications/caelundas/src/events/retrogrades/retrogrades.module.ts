import { Module } from "@nestjs/common";

import { RetrogradesService } from "./retrogrades.service";

/**
 *
 */
@Module({
  providers: [RetrogradesService],
  exports: [RetrogradesService],
})
export class RetrogradesModule {}
