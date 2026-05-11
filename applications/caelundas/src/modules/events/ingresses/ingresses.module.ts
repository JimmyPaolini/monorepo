import { EphemerisModule } from "@caelundas/src/modules/ephemeris/ephemeris.module";
import { Module } from "@nestjs/common";

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
