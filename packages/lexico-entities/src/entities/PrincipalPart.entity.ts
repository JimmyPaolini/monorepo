import { Field, ObjectType } from "@nestjs/graphql";
import { Column, Entity, Index, ManyToOne } from "typeorm";

import { AuditableEntity } from "./Auditable.entity.js";

import type { Lexeme } from "./Lexeme.entity.js";

/**
 *
 */
@ObjectType()
@Entity({
  name: "principal_parts",
  comment:
    "A named principal part (e.g. first, infinitive) of a Latin dictionary entry",
})
export class PrincipalPart extends AuditableEntity {
  @Field(() => Object)
  @Index()
  @ManyToOne("Lexeme", "principalParts", {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  lexeme!: Lexeme;

  @Field()
  @Column("varchar", {
    length: 63,
    comment: "Label for the principal part (e.g. first, infinitive)",
  })
  name!: string;

  @Field(() => [String])
  @Column("jsonb", {
    comment: "One or more textual forms for this principal part",
  })
  text!: string[];
}
