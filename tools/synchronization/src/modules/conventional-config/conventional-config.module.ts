import { Module } from "@nestjs/common";

import { LoggerModule } from "../logger/logger.module";
import { SynchronizationModeService } from "../synchronization/synchronization-mode.service";

import { ConventionalConfigIoService } from "./conventional-config-io.service";
import { ConventionalConfigValidatorsService } from "./conventional-config-validators.service";
import { ConventionalConfigCommand } from "./conventional-config.command";
import { ConventionalConfigService } from "./conventional-config.service";

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
    ConventionalConfigIoService,
    ConventionalConfigService,
    ConventionalConfigValidatorsService,
    SynchronizationModeService,
  ],
})
export class ConventionalConfigModule {}
