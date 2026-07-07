import { Module } from "@nestjs/common";

import { GeneratorRunnerService } from "./generator-runner.service";
import { GeneratorTemplateService } from "./generator-template.service";
import { GeneratorService } from "./generator.service";

/**
 * Shared generator support module for conformance command scaffolding.
 */
@Module({
  controllers: [],
  exports: [GeneratorRunnerService, GeneratorService, GeneratorTemplateService],
  imports: [],
  providers: [
    GeneratorRunnerService,
    GeneratorService,
    GeneratorTemplateService,
  ],
})
export class GeneratorModule {}
