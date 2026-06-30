import { Module } from "@nestjs/common";

import { LoggerModule } from "../logger/logger.module";
import { SynchronizationModeService } from "../synchronization/synchronization-mode.service";

import { PullRequestTemplateCommand } from "./pull-request-template.command";

/**
 * TODO: Document the pullRequestTemplate module.
 */
@Module({
  controllers: [],
  exports: [PullRequestTemplateCommand],
  imports: [LoggerModule],
  providers: [PullRequestTemplateCommand, SynchronizationModeService],
})
export class PullRequestTemplateModule {}
