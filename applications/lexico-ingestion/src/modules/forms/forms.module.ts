import { Module } from "@nestjs/common";

import { FormsService } from "./forms.service.js";

/**
 * Provides the FormsService for converting raw parsed Forms objects
 * into normalized TypeORM Form entities during lexeme ingestion.
 */
@Module({
  controllers: [],
  exports: [FormsService],
  imports: [],
  providers: [FormsService],
})
export class FormsModule {}
