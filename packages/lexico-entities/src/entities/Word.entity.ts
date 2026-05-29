import {
  BaseEntity,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryColumn,
} from 'typeorm';

import { Entry } from './Entry.entity.js';

@Entity()
export class Word extends BaseEntity {
  @PrimaryColumn()
  word!: string;

  @ManyToMany(() => Entry, (entry) => entry.words, {
    eager: true,
    cascade: true,
  })
  @JoinTable()
  entries!: Entry[];
}
