import { Module } from "@nestjs/common";

import { ValidatorAbstractSyntaxTreeService } from "./validator-abstract-syntax-tree.service";
import { ValidatorCommentsService } from "./validator-comments.service";
import { ValidatorFilesService } from "./validator-files.service";
import { ValidatorNodesService } from "./validator-nodes.service";
import { ValidatorPythonBridgeService } from "./validator-python-bridge.service";
import { ValidatorRulesService } from "./validator-rules.service";
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
    ValidatorNodesService,
    ValidatorPythonBridgeService,
    ValidatorRulesService,
    ValidatorService,
    ValidatorTypescriptService,
    ValidatorWorkspaceService,
  ],
  imports: [],
  providers: [
    ValidatorAbstractSyntaxTreeService,
    ValidatorCommentsService,
    ValidatorCommandService,
    ValidatorFilesService,
    ValidatorNodesService,
    ValidatorPythonBridgeService,
    ValidatorRulesService,
    ValidatorService,
    ValidatorTypescriptService,
    ValidatorWorkspaceService,
  ],
})
export class ValidatorModule {}
