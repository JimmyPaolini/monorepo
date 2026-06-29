import { Module } from "@nestjs/common";

import { JupyterNotebookApplicationCommand } from "./jupyter-notebook-application.command";

/**
 * TODO: Document the jupyterNotebookApplicationGenerator module.
 */
@Module({
  controllers: [],
  exports: [JupyterNotebookApplicationCommand],
  imports: [],
  providers: [JupyterNotebookApplicationCommand],
})
export class JupyterNotebookApplicationModule {}
