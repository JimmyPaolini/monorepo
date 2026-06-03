import { Field, ID, InterfaceType } from "@nestjs/graphql";
import {
  BaseEntity,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  TableInheritance,
} from "typeorm";

import type { Lexeme } from "../Lexeme.entity.js";

/**
 *
 */
@InterfaceType()
@Entity({
  name: "inflections",
  schema: "public",
  comment:
    "Abstract base table for grammatical inflection metadata using single-table inheritance",
})
@TableInheritance({ column: { type: "text", name: "type" } })
export class Inflection extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid", {
    comment:
      "Auto-generated UUID; discriminator column 'type' selects the child entity",
  })
  id!: string;

  /** The lexeme this inflection metadata belongs to. */
  @OneToOne("Lexeme", "inflection", {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn()
  lexeme!: Lexeme;
}
