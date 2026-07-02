import { Module } from "@nestjs/common";

import { ReactComponentCommand } from "./react-component.command";

/**
 * TODO: Document the reactComponentGenerator module.
 */
@Module({
  controllers: [],
  exports: [ReactComponentCommand],
  imports: [],
  providers: [ReactComponentCommand],
})
export class ReactComponentModule {}
