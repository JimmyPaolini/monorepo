import { Module } from "@nestjs/common";

import { ProgressiveUtilitiesService } from "./progressive.utilities";

/**
 *
 */
@Module({
  providers: [ProgressiveUtilitiesService],
  exports: [ProgressiveUtilitiesService],
})
export class ProgressiveUtilitiesModule {}
