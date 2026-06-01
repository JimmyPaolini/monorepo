import { Field, ID, ObjectType } from "@nestjs/graphql";
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";

import { AuditableEntity } from "./Auditable.entity.js";
import { Inflection } from "./inflection/Inflection.entity.js";
import { type PartOfSpeech, partOfSpeechValues } from "./PartOfSpeech.js";
import { PrincipalPart } from "./PrincipalPart.entity.js";
import { Pronunciation } from "./Pronunciation.entity.js";
import { Translation } from "./Translation.entity.js";

import type { Forms } from "./forms/Forms.entity.js";
import type { Word } from "./Word.entity.js";

/**
 *
 */
@ObjectType()
@Entity({
  name: "lexemes",
  comment:
    "A dictionary entry representing a Latin word form with its translations, principal parts, pronunciation, and inflection data",
})
@Unique(["lemma", "disambiguator"])
export class Lexeme extends AuditableEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid", {
    comment: "Auto-generated UUID primary key",
  })
  id!: string;

  @Field()
  @Index()
  @Column("varchar", {
    length: 127,
    comment: "Dictionary headword (lemma), e.g. 'amō'",
  })
  lemma!: string;

  @Field()
  @Column("smallint", {
    default: 0,
    comment:
      "Disambiguation index when multiple entries share the same lemma (0-based)",
  })
  disambiguator!: number;

  @Field({ nullable: true })
  @Column("varchar", {
    length: 1027,
    nullable: true,
    comment: "Etymology of the word (Latin or Greek origin)",
  })
  etymology?: string;

  @Field(() => Object, { nullable: true })
  @Column("jsonb", {
    nullable: true,
    comment:
      "Pre-computed inflected forms as a nested JSON object keyed by morphological identifiers",
  })
  forms?: Forms | null;

  @Field(() => Inflection, { nullable: true })
  @OneToOne(() => Inflection, {
    nullable: true,
    cascade: true,
    onDelete: "SET NULL",
  })
  @JoinColumn()
  inflection?: Inflection | null;

  @Field(() => String)
  @Index()
  @Column({
    type: "enum",
    enum: partOfSpeechValues,
    comment: "Grammatical part of speech",
  })
  partOfSpeech!: PartOfSpeech;

  @Field(() => [PrincipalPart])
  @OneToMany(() => PrincipalPart, "lexeme", {
    cascade: true,
  })
  principalParts!: PrincipalPart[];

  @Field(() => [Pronunciation], { nullable: true })
  @OneToMany(() => Pronunciation, "lexeme", {
    cascade: true,
  })
  pronunciations?: Pronunciation[] | null;

  @Field(() => [Translation], { nullable: true })
  @OneToMany(() => Translation, (translation) => translation.lexeme, {
    nullable: true,
    cascade: true,
    onDelete: "CASCADE",
  })
  translations?: Translation[] | null;

  @Field(() => [Object], { nullable: true })
  @ManyToMany("Word", "lexemes")
  words?: Word[];
}
