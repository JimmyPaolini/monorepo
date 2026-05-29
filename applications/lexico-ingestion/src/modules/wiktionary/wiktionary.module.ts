import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Entry, Word } from '@monorepo/lexico-entities';

import { WiktionaryCommand } from './wiktionary.command.js';
import { WiktionaryService } from './wiktionary.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Entry, Word])],
  providers: [WiktionaryCommand, WiktionaryService],
  exports: [WiktionaryService],
})
export class WiktionaryModule {}
