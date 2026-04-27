import { Module } from "@nestjs/common";

import { EclipsesService } from "./eclipses.service";

/**
 *
 */
@Module({
  providers: [EclipsesService],
  exports: [EclipsesService],
})
export class EclipsesModule {}
