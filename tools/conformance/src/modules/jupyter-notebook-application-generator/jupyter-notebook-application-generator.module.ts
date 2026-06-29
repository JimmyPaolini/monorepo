import { Module } from "@nestjs/common";

import { JupyterNotebookApplicationGeneratorCommand } from "./jupyter-notebook-application-generator.command";

/**
 * TODO: Document the jupyterNotebookApplicationGenerator module.
 */
@Module({
  controllers: [],
  exports: [JupyterNotebookApplicationGeneratorCommand],
  imports: [],
  providers: [JupyterNotebookApplicationGeneratorCommand],
})
export class JupyterNotebookApplicationGeneratorModule {}
