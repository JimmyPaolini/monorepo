import { Field, ObjectType } from "@nestjs/graphql";
import { Column, Entity, Index, ManyToOne, OneToMany } from "typeorm";

import { AuditableEntity } from "../Auditable.entity.js";

import type { Author } from "./Author.entity.js";
import type { Text } from "./Text.entity.js";
import type { Token } from "./Token.entity.js";

/**
 * Represents a single line of text from a classical Latin work.
 */
@Entity({
  comment: "A single line of classical Latin literature",
  name: "lines",
  schema: "public",
})
@Index(["text", "index"], { unique: true })
@ObjectType()
export class Line extends AuditableEntity {
  @Field(() => Object)
  @Index()
  @ManyToOne("Author", { eager: false, onDelete: "CASCADE" })
  author!: Author;

  @Column("varchar", { comment: "The raw text data content of the line" })
  @Field()
  data!: string;

  @Column("bigint", {
    comment: "The sequential 0-based index of the line within its text",
  })
  @Field()
  index!: number;

  @Column("varchar", {
    comment:
      "The display label for the line (e.g. section number or roman numeral)",
    length: 32,
  })
  @Field()
  label!: string;

  @Field(() => Object)
  @ManyToOne("Text", "lines", { eager: true, onDelete: "CASCADE" })
  text!: Text;

  @Field(() => [Object])
  @OneToMany("Token", "line", { cascade: true })
  tokens!: Token[];
}
