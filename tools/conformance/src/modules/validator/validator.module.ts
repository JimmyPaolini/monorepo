import { Module } from "@nestjs/common";

import { ValidatorCommandService } from "./validator.command.service";
import { ValidatorService } from "./validator.service";

/**
 * Validator command module for workspace conformance checks.
 */
@Module({
  controllers: [],
  exports: [ValidatorCommandService, ValidatorService],
  imports: [],
  providers: [ValidatorCommandService, ValidatorService],
})
export class ValidatorModule {}
