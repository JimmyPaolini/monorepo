import { Field, ObjectType } from "@nestjs/graphql";
import {
  BaseEntity,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryColumn,
} from "typeorm";

import { Lexeme } from "./Lexeme.entity.js";

@ObjectType()
@Entity({
  name: "words",
  comment: "A Latin word string that maps to one or more dictionary entries",
})
export class Word extends BaseEntity {
  @Field()
  @PrimaryColumn({ comment: "The Latin word as written" })
  word!: string;

  @Field(() => [Lexeme])
  @ManyToMany(() => Lexeme, (lexeme) => lexeme.words, {
    eager: true,
    cascade: true,
  })
  @JoinTable()
  lexemes!: Lexeme[];
}
