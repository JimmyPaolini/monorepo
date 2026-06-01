import { Field, ID, ObjectType } from "@nestjs/graphql";
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { AuditableEntity } from "./Auditable.entity.js";

import type { Lexeme } from "./Lexeme.entity.js";

/**
 *
 */
@ObjectType()
@Entity({
  name: "translations",
  comment: "An English translation of a Latin dictionary entry",
})
export class Translation extends AuditableEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid", { comment: "Auto-generated UUID" })
  id!: string;

  @Field(() => Object)
  @ManyToOne("Lexeme", "translations", {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn()
  lexeme!: Lexeme;

  @Field()
  @Index()
  @Column("varchar", { length: 2047, comment: "English translation text" })
  translation!: string;

  constructor(translation: string, lexeme?: Lexeme) {
    super();
    this.translation = translation;
    if (lexeme) this.lexeme = lexeme;
  }
}
