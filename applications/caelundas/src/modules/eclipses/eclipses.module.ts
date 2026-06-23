import { EphemerisModule } from "@caelundas/src/modules/ephemeris/ephemeris.module";
import { MathModule } from "@caelundas/src/modules/math/math.module";
import { ProgressiveUtilitiesModule } from "@caelundas/src/modules/progressive/progressive-utilities.module";
import { Module } from "@nestjs/common";

import { EclipseCalculationService } from "./eclipse-calculation.service";
import { EclipseEventService } from "./eclipse-event.service";
import { EclipseGeometryService } from "./eclipse-geometry.service";
import { EclipseTopocentricService } from "./eclipse-topocentric.service";
import { EclipsesService } from "./eclipses.service";

/**
 * NestJS module for solar and lunar eclipse event detection.
 * Exports {@link EclipsesService} which identifies eclipse phases (beginning, maximum, ending)
 * in both geocentric and topocentric reference frames.
 */
@Module({
  controllers: [],
  exports: [EclipsesService],
  imports: [EphemerisModule, MathModule, ProgressiveUtilitiesModule],
  providers: [
    EclipseEventService,
    EclipseGeometryService,
    EclipseTopocentricService,
    EclipseCalculationService,
    EclipsesService,
  ],
})
export class EclipsesModule {}
