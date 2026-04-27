import { Module } from "@nestjs/common";

import { EphemerisAggregatesService } from "./ephemeris.aggregates";
import { EphemerisService } from "./ephemeris.service";

@Module({
  providers: [EphemerisService, EphemerisAggregatesService],
  exports: [EphemerisService, EphemerisAggregatesService],
})
export class EphemerisModule {}
