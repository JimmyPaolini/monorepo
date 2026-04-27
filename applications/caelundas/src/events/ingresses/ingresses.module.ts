import { Module } from "@nestjs/common";

import { IngressesService } from "./ingresses.service";

/**
 *
 */
@Module({
  providers: [IngressesService],
  exports: [IngressesService],
})
export class IngressesModule {}
