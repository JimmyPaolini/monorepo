import { Module } from "@nestjs/common";

import { TripleAspectsHelperService } from "./triple-aspects-helper.service";
import { TripleAspectsService } from "./triple-aspects.service";

/**
 * NestJS module for 3-body compound aspect pattern detection.
 * Exports {@link TripleAspectsService} which identifies T-Square and Grand Trine
 * configurations from the active 2-body aspect registry.
 */
@Module({
  controllers: [],
  exports: [TripleAspectsService],
  imports: [],
  providers: [TripleAspectsHelperService, TripleAspectsService],
})
export class TripleAspectsModule {}
