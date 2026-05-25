import { Module } from "@nestjs/common";

import { SampleService } from "./sample.service";

/**
 * TODO: Document the sample module.
 */
@Module({
  controllers: [],
  exports: [SampleService],
  imports: [],
  providers: [SampleService],
})
export class SampleModule {}
