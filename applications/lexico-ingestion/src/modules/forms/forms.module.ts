import { Form, Word, WordForm, WordLexeme } from "@monorepo/lexico-entities";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { FormsService } from "./forms.service";

/**
 * TODO: Document the forms module.
 */
@Module({
  controllers: [],
  exports: [FormsService],
  imports: [TypeOrmModule.forFeature([Form, Word, WordLexeme, WordForm])],
  providers: [FormsService],
})
export class FormsModule {}
