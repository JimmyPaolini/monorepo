import { Module } from "@nestjs/common";

import { LoggerModule } from "../logger/logger.module";

import { ConventionalConfigConstantsService } from "./conventional-config-constants.service";
import { ConventionalConfigIoService } from "./conventional-config-io.service";
import { ConventionalConfigSynchronizationService } from "./conventional-config-synchronization.service";
import { ConventionalConfigValidatorsService } from "./conventional-config-validators.service";
import { ConventionalConfigCommand } from "./conventional-config.command";

/**
 * Module for the conventional-config sync workflow.
 * Provides all services required to check and write conventional commit configuration files.
 */
@Module({
  controllers: [],
  exports: [ConventionalConfigCommand],
  imports: [LoggerModule],
  providers: [
    ConventionalConfigCommand,
    ConventionalConfigConstantsService,
    ConventionalConfigIoService,
    ConventionalConfigSynchronizationService,
    ConventionalConfigValidatorsService,
  ],
})
export class ConventionalConfigModule {}
