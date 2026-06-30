import { Module } from "@nestjs/common";

import { LoggerModule } from "../logger/logger.module";
import { SynchronizationModeService } from "../synchronization/synchronization-mode.service";

import { DevcontainerConfigurationCommand } from "./devcontainer-configuration.command";

/**
 * TODO: Document the devcontainerConfiguration module.
 */
@Module({
  controllers: [],
  exports: [DevcontainerConfigurationCommand],
  imports: [LoggerModule],
  providers: [DevcontainerConfigurationCommand, SynchronizationModeService],
})
export class DevcontainerConfigurationModule {}
