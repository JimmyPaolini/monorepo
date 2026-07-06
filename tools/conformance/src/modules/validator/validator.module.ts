import { Module } from "@nestjs/common";

import { LoggerModule } from "../logger/logger.module";

import { ValidatorAbstractSyntaxTreeService } from "./validator-abstract-syntax-tree.service";
import { ValidatorCommentsService } from "./validator-comments.service";
import { ValidatorFilesService } from "./validator-files.service";
import { ValidatorJsonService } from "./validator-json.service";
import { ValidatorMarkdownService } from "./validator-markdown.service";
import { ValidatorNodesService } from "./validator-nodes.service";
import { ValidatorPythonBridgeService } from "./validator-python-bridge.service";
import { ValidatorRulesService } from "./validator-rules.service";
import { ValidatorTextService } from "./validator-text.service";
import { ValidatorTypescriptService } from "./validator-typescript.service";
import { ValidatorWorkspaceService } from "./validator-workspace.service";
import { ValidatorCommandService } from "./validator.command.service";
import { ValidatorService } from "./validator.service";

/**
 * Validator command module for workspace conformance checks.
 */
@Module({
  controllers: [],
  exports: [
    ValidatorAbstractSyntaxTreeService,
    ValidatorCommentsService,
    ValidatorCommandService,
    ValidatorFilesService,
    ValidatorJsonService,
    ValidatorMarkdownService,
    ValidatorNodesService,
    ValidatorPythonBridgeService,
    ValidatorRulesService,
    ValidatorService,
    ValidatorTextService,
    ValidatorTypescriptService,
    ValidatorWorkspaceService,
  ],
  imports: [LoggerModule],
  providers: [
    ValidatorAbstractSyntaxTreeService,
    ValidatorCommentsService,
    ValidatorCommandService,
    ValidatorFilesService,
    ValidatorJsonService,
    ValidatorMarkdownService,
    ValidatorNodesService,
    ValidatorPythonBridgeService,
    ValidatorRulesService,
    ValidatorService,
    ValidatorTextService,
    ValidatorTypescriptService,
    ValidatorWorkspaceService,
  ],
})
export class ValidatorModule {}
