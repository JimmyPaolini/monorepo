import { Module } from "@nestjs/common";

import { QuadrupleAspectsHelperService } from "./quadruple-aspects-helper.service";
import { QuadrupleAspectsService } from "./quadruple-aspects.service";

/**
 * NestJS module for 4-body compound aspect pattern detection.
 * Exports {@link QuadrupleAspectsService} which identifies Grand Cross and Kite
 * configurations from the active 2-body aspect registry.
 */
@Module({
  controllers: [],
  exports: [QuadrupleAspectsService],
  imports: [],
  providers: [QuadrupleAspectsHelperService, QuadrupleAspectsService],
})
export class QuadrupleAspectsModule {}
