import { Form } from "@monorepo/lexico-entities";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { WordsModule } from "../words/words.module";

import { FormsService } from "./forms.service";

/**
 * TODO: Document the forms module.
 */
@Module({
  controllers: [],
  exports: [FormsService],
  imports: [TypeOrmModule.forFeature([Form]), WordsModule],
  providers: [FormsService],
})
export class FormsModule {}
