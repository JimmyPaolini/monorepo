import { Field, ObjectType } from "@nestjs/graphql";
import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";

import { AuditableEntity } from "./Auditable.entity.js";

import type { Lexeme } from "./Lexeme.entity.js";

/**
 *
 */
@Entity({
  comment: "An English translation of a Latin dictionary entry",
  name: "translations",
  schema: "public",
})
@ObjectType()
export class Translation extends AuditableEntity {
  constructor(translation: string, lexeme?: Lexeme) {
    super();
    this.translation = translation;
    if (lexeme) this.lexeme = lexeme;
  }

  @Field(() => Object)
  @Index()
  @JoinColumn()
  @ManyToOne("Lexeme", "translations", {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  lexeme!: Lexeme;

  @Column("text", { comment: "English translation text" })
  @Field()
  @Index()
  translation!: string;

  @Column({
    asExpression: "to_tsvector('english', translation)",
    generatedType: "STORED",
    nullable: true,
    select: false,
    type: "tsvector",
  })
  @Index({ type: "gin" })
  translationFullTextSearch!: string;
}
