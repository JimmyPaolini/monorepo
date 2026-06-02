import { Field, ObjectType } from "@nestjs/graphql";
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  OneToMany,
  OneToOne,
  Unique,
} from "typeorm";

import { AuditableEntity } from "./Auditable.entity.js";
import { Form } from "./form/Form.entity.js";
import { Inflection } from "./inflection/Inflection.entity.js";
import {
  type PartOfSpeech,
  partOfSpeechValues,
} from "./PartOfSpeech.entity.js";
import { PrincipalPart } from "./PrincipalPart.entity.js";
import { Pronunciation } from "./Pronunciation.entity.js";
import { Translation } from "./Translation.entity.js";
import { WordLexeme } from "./WordLexeme.entity.js";

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
    length: 4096,
    nullable: true,
    comment: "Etymology of the word (Latin or Greek origin)",
  })
  etymology?: string;

  @Field(() => [Form])
  @OneToMany(() => Form, (form) => form.lexeme, { cascade: true })
  forms!: Form[];

  @Field(() => Inflection, { nullable: true })
  @Index()
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
    orphanedRowAction: "delete",
  })
  pronunciations?: Pronunciation[] | null;

  @Field(() => [Translation], { nullable: true })
  @OneToMany(() => Translation, (translation) => translation.lexeme, {
    nullable: true,
    cascade: true,
    onDelete: "CASCADE",
  })
  translations?: Translation[] | null;

  /** Junction rows linking this lexeme to every word string that can represent it. */
  @Field(() => [Object], { nullable: true })
  @OneToMany("WordLexeme", "lexeme")
  wordLexemes?: WordLexeme[];
}
