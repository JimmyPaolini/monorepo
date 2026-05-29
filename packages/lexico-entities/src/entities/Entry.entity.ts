import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryColumn,
} from "typeorm";

import { type PartOfSpeech, partOfSpeechValues } from "./PartOfSpeech.js";
import { PrincipalPart } from "./PrincipalPart.entity.js";
import { Pronunciation } from "./Pronunciation.js";
import { Translation } from "./Translation.entity.js";
import { Forms } from "./forms/Forms.entity.js";
import { Inflection } from "./inflection/Inflection.entity.js";

@Entity()
export class Entry extends BaseEntity {
  @PrimaryColumn("varchar", { length: 127, unique: true })
  id!: string;

  @Column({ type: "enum", enum: partOfSpeechValues })
  partOfSpeech!: PartOfSpeech;

  @OneToMany(() => PrincipalPart, "entry", {
    eager: true,
    cascade: true,
  })
  principalParts!: PrincipalPart[];

  @OneToOne(() => Inflection, {
    nullable: true,
    eager: true,
    cascade: true,
    onDelete: "SET NULL",
  })
  @JoinColumn()
  inflection?: Inflection | null;

  @OneToMany(() => Translation, (translation) => translation.entry, {
    nullable: true,
    eager: true,
    cascade: true,
    onDelete: "CASCADE",
  })
  translations?: Translation[] | null;

  @OneToOne(() => Forms, {
    nullable: true,
    eager: true,
    cascade: true,
    onDelete: "SET NULL",
  })
  @JoinColumn()
  forms?: Forms | null;

  @ManyToMany("Word", "entries")
  words?: unknown[];

  @Column(() => Pronunciation)
  pronunciation?: Pronunciation;

  @Column("varchar", { length: 1027, nullable: true })
  etymology?: string;
}
