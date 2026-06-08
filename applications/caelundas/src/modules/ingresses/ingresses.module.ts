import { EphemerisModule } from "@caelundas/src/modules/ephemeris/ephemeris.module";
import { Module } from "@nestjs/common";

import { IngressesService } from "./ingresses.service";

/**
 * NestJS module for zodiacal ingress event detection.
 * Exports {@link IngressesService} which identifies when celestial bodies enter new
 * zodiac signs, decans, or reach their sign peak longitude.
 */
@Module({
  controllers: [],
  exports: [IngressesService],
  imports: [EphemerisModule],
  providers: [IngressesService],
})
export class IngressesModule {}
