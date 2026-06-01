import { Field, ID, ObjectType } from "@nestjs/graphql";
import {
  BaseEntity,
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { type Entry } from "./Entry.entity.js";

@ObjectType()
@Entity({
  name: "principal_parts",
  comment:
    "A named principal part (e.g. first, infinitive) of a Latin dictionary entry",
})
export class PrincipalPart extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid", { comment: "Auto-generated UUID" })
  id!: string;

  @Field(() => Object)
  @ManyToOne("Entry", "principalParts", {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  entry!: Entry;

  @Field()
  @Column("varchar", {
    length: 63,
    comment: "Label for the principal part (e.g. first, infinitive)",
  })
  name!: string;

  @Field(() => [String])
  @Column("simple-array", {
    comment: "One or more textual forms for this principal part",
  })
  text!: string[];
}
