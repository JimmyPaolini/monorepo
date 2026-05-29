import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Entry, Word, Translation } from '@monorepo/lexico-entities';

import { DictionaryCommand } from './dictionary.command.js';
import { DictionaryService } from './dictionary.service.js';
import { IngesterService } from './ingester.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Entry, Word, Translation])],
  providers: [DictionaryCommand, DictionaryService, IngesterService],
  exports: [DictionaryService],
})
export class DictionaryModule {}
