import { Module } from "@nestjs/common";

import { EphemerisModule } from "@caelundas/src/ephemeris/ephemeris.module";

import { IngressesService } from "./ingresses.service";

/**
 *
 */
@Module({
  imports: [EphemerisModule],
  providers: [IngressesService],
  exports: [IngressesService],
})
export class IngressesModule {}
