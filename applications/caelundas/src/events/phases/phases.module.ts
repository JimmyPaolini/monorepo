import { Module } from "@nestjs/common";

import { PhasesService } from "./phases.service";

/**
 *
 */
@Module({
  providers: [PhasesService],
  exports: [PhasesService],
})
export class PhasesModule {}
