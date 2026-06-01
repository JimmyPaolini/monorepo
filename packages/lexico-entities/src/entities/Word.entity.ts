import { Field, ObjectType } from "@nestjs/graphql";
import { Entity, JoinTable, ManyToMany, PrimaryColumn } from "typeorm";

import { AuditableEntity } from "./Auditable.entity.js";
import { Lexeme } from "./Lexeme.entity.js";

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
  @PrimaryColumn({ comment: "The Latin word as written" })
  word!: string;

  @Field(() => [Lexeme])
  @ManyToMany(() => Lexeme, (lexeme) => lexeme.words, {
    cascade: true,
  })
  @JoinTable()
  lexemes!: Lexeme[];
}
