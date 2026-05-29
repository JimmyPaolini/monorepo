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
@Entity()
export class PrincipalPart extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Field(() => Object)
  @ManyToOne("Entry", "principalParts", {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  entry!: Entry;

  @Field()
  @Column("varchar", { length: 63 })
  name!: string;

  @Field(() => [String])
  @Column("simple-array")
  text!: string[];
}
