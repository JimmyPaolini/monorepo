import { Module } from "@nestjs/common";

import { ReactComponentGeneratorCommand } from "./react-component-generator.command";

/**
 * TODO: Document the reactComponentGenerator module.
 */
@Module({
  controllers: [],
  exports: [ReactComponentGeneratorCommand],
  imports: [],
  providers: [ReactComponentGeneratorCommand],
})
export class ReactComponentGeneratorModule {}
