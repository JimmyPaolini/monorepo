import { Module } from "@nestjs/common";

import { TwilightsService } from "./twilights.service";

/**
 *
 */
@Module({
  providers: [TwilightsService],
  exports: [TwilightsService],
})
export class TwilightsModule {}
