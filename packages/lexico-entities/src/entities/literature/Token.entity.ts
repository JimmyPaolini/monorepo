import { Field, ObjectType } from "@nestjs/graphql";
import { Column, Entity, Index, JoinColumn, ManyToOne } from "typeorm";

import { AuditableEntity } from "../Auditable.entity.js";

import type { Word } from "../dictionary/Word.entity.js";
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
@Index(["line", "index"], { unique: true })
@Index(["text", "index"])
@ObjectType()
export class Token extends AuditableEntity {
  @Field(() => Object)
  @Index()
  @ManyToOne("Author", { eager: false, onDelete: "CASCADE" })
  author!: Author;

  @Column("varchar", { comment: "The raw string value of the token" })
  @Field()
  @Index()
  data!: string;

  @Column("bigint", {
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

  @Field(() => Object)
  @ManyToOne("Text", { eager: false, onDelete: "CASCADE" })
  text!: Text;

  @Field(() => Object, { nullable: true })
  @Index()
  @JoinColumn()
  @ManyToOne("Word", { eager: false, nullable: true })
  word?: null | Word;
}
