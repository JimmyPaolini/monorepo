import { Field, ObjectType } from "@nestjs/graphql";
import { Column, Entity, OneToMany } from "typeorm";

import { AuditableEntity } from "../Auditable.entity.js";

import { WordForm } from "./WordForm.entity.js";
import { WordLexeme } from "./WordLexeme.entity.js";

/**
 *
 */
@Entity({
  comment: "A Latin word string that maps to one or more dictionary entries",
  name: "words",
  schema: "public",
})
@ObjectType()
export class Word extends AuditableEntity {
  @Column({
    comment: "The Latin word as written",
    unique: true,
  })
  @Field()
  data!: string;

  /** Junction rows linking this word to every morphological form it can surface as. */
  @Field(() => [WordForm])
  @OneToMany(() => WordForm, (wf) => wf.word)
  wordForms!: WordForm[];

  /** Junction rows linking this word to every lexeme it can represent. */
  @Field(() => [WordLexeme])
  @OneToMany(() => WordLexeme, (wl) => wl.word)
  wordLexemes!: WordLexeme[];
}
