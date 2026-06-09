import { Field, ObjectType } from "@nestjs/graphql";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";

import { AuditableEntity } from "../Auditable.entity.js";

import type { Word } from "../Word.entity.js";
import type { Author } from "./Author.entity.js";
import type { Line } from "./Line.entity.js";
import type { Text } from "./Text.entity.js";

/**
 * Represents a single token (word or punctuation) parsed from a line of text.
 */
@Entity({
  comment:
    "A single parsed token (word or punctuation) from a line of literature",
  name: "tokens",
  schema: "public",
})
@ObjectType()
export class Token extends AuditableEntity {
  @Field(() => Object)
  @ManyToOne("Author", { eager: false, onDelete: "CASCADE" })
  author!: Author;

  @Column("int", {
    comment: "The 0-based index of this token within its parent line",
  })
  @Field()
  index!: number;

  @Column("boolean", {
    comment:
      "True if the token represents punctuation or whitespace, false if it is a word",
  })
  @Field()
  isPunctuation!: boolean;

  @Field(() => Object)
  @ManyToOne("Line", "tokens", { eager: false, onDelete: "CASCADE" })
  line!: Line;

  @Column("varchar", {
    comment: "Unique slug identifier (e.g. line_slug_index)",
    length: 128,
    unique: true,
  })
  @Field()
  slug!: string;

  @Field(() => Object)
  @ManyToOne("Text", { eager: false, onDelete: "CASCADE" })
  text!: Text;

  @Column("varchar", { comment: "The raw string value of the token" })
  @Field()
  textValue!: string;

  @Field(() => Object, { nullable: true })
  @JoinColumn()
  @ManyToOne("Word", { eager: false, nullable: true })
  word?: null | Word;
}
