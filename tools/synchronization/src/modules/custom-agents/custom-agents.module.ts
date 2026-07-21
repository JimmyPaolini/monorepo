import { Module } from "@nestjs/common";

import { LoggerModule } from "../logger/logger.module";
import { SynchronizationModeService } from "../synchronization/synchronization-mode.service";

import { CustomAgentsCommand } from "./custom-agents.command";

/** NestJS module that registers the custom-agents sync command. */
@Module({
  imports: [LoggerModule],
  providers: [CustomAgentsCommand, SynchronizationModeService],
})
export class CustomAgentsModule {}
