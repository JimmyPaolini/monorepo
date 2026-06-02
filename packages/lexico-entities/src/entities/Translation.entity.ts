import { Field, ObjectType } from "@nestjs/graphql";
import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";

import { AuditableEntity } from "./Auditable.entity.js";

import type { Lexeme } from "./Lexeme.entity.js";

/**
 *
 */
@ObjectType()
@Entity({
  name: "translations",
  schema: "public",
  comment: "An English translation of a Latin dictionary entry",
})
export class Translation extends AuditableEntity {
  @Field(() => Object)
  @Index()
  @ManyToOne("Lexeme", "translations", {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn()
  lexeme!: Lexeme;

  @Field()
  @Index()
  @Column("text", { comment: "English translation text" })
  translation!: string;

  @Index({ type: "gin" })
  @Column({
    type: "tsvector",
    generatedType: "STORED",
    asExpression: "to_tsvector('english', translation)",
    nullable: true,
    select: false,
  })
  translationFullTextSearch!: string;

  constructor(translation: string, lexeme?: Lexeme) {
    super();
    this.translation = translation;
    if (lexeme) this.lexeme = lexeme;
  }
}
