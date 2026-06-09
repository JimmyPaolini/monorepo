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
@ObjectType()
export class Line extends AuditableEntity {
  @Field(() => Object)
  @Index()
  @ManyToOne("Author", { eager: false, onDelete: "CASCADE" })
  author!: Author;

  @Column("varchar", { comment: "The raw text content of the line" })
  @Field()
  line!: string;

  @Column("varchar", {
    comment:
      "The display label for the line (e.g. section number or roman numeral)",
    length: 32,
  })
  @Field()
  lineLabel!: string;

  @Column("bigint", {
    comment: "The sequential 0-based index of the line within its text",
  })
  @Field()
  lineNumber!: number;

  @Column("varchar", {
    comment: "Unique slug identifier (e.g. 'caesar/de bello gallico_12')",
    length: 128,
    unique: true,
  })
  @Field()
  slug!: string;

  @Field(() => Object)
  @Index()
  @ManyToOne("Text", "lines", { eager: true, onDelete: "CASCADE" })
  text!: Text;

  @Field(() => [Object])
  @OneToMany("Token", "line", { cascade: true })
  tokens!: Token[];
}
