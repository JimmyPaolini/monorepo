import { Module } from "@nestjs/common";

import { LoggerModule } from "../logger/logger.module";

import { DevcontainerConfigurationCommand } from "./devcontainer-configuration.command";

/**
 * TODO: Document the devcontainerConfiguration module.
 */
@Module({
  controllers: [],
  exports: [DevcontainerConfigurationCommand],
  imports: [LoggerModule],
  providers: [DevcontainerConfigurationCommand],
})
export class DevcontainerConfigurationModule {}
