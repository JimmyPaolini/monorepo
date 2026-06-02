import { Field, ObjectType } from "@nestjs/graphql";
import { Column, Entity, OneToMany } from "typeorm";

import { AuditableEntity } from "./Auditable.entity.js";
import { WordForm } from "./WordForm.entity.js";
import { WordLexeme } from "./WordLexeme.entity.js";

/**
 *
 */
@ObjectType()
@Entity({
  name: "words",
  comment: "A Latin word string that maps to one or more dictionary entries",
})
export class Word extends AuditableEntity {
  @Field()
  @Column({
    unique: true,
    comment: "The Latin word as written",
  })
  word!: string;

  /** Junction rows linking this word to every lexeme it can represent. */
  @Field(() => [WordLexeme])
  @OneToMany(() => WordLexeme, (wl) => wl.word)
  wordLexemes!: WordLexeme[];

  /** Junction rows linking this word to every morphological form it can surface as. */
  @Field(() => [WordForm])
  @OneToMany(() => WordForm, (wf) => wf.word)
  wordForms!: WordForm[];
}
