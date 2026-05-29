import {
  BaseEntity,
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryColumn,
} from "typeorm";

import type { PartOfSpeech } from "./PartOfSpeech.js";
import type { PrincipalPart } from "./PrincipalPart.js";
import type { Pronunciation } from "./Pronunciation.js";
import { Translation } from "./Translation.entity.js";
import type {
  AdjectiveInflection,
  AdverbInflection,
  NounInflection,
  PrepositionInflection,
  Uninflected,
  VerbInflection,
} from "./inflection/index.js";

export type Inflection =
  | NounInflection
  | VerbInflection
  | AdjectiveInflection
  | AdverbInflection
  | PrepositionInflection
  | Uninflected;

@Entity()
export class Entry extends BaseEntity {
  @PrimaryColumn("varchar", { length: 127, unique: true })
  id!: string; // word + ":" + number

  @Column("varchar", { length: 32 })
  partOfSpeech!: PartOfSpeech;

  @Column("json", { nullable: true })
  principalParts!: PrincipalPart[] | null;

  @Column("json", { nullable: true })
  inflection?: Inflection | null;

  @OneToMany(() => Translation, (translation) => translation.entry, {
    nullable: true,
    eager: true,
    cascade: true,
    onDelete: "CASCADE",
  })
  translations?: Translation[] | null;

  @Column("json", { nullable: true })
  forms?: unknown | null;

  @ManyToMany("Word", "entries")
  words?: unknown[];

  @Column("json", { nullable: true })
  pronunciation?: Pronunciation;

  @Column("varchar", { length: 1027, nullable: true })
  etymology?: string;
}
