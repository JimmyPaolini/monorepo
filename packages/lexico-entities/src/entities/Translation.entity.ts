import { Field, ID, ObjectType } from "@nestjs/graphql";
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { type Entry } from "./Entry.entity.js";

@ObjectType()
@Entity()
export class Translation extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Field(() => Object)
  @ManyToOne("Entry", "translations", {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn()
  entry!: Entry;

  @Field()
  @Column("varchar", { length: 2047 })
  translation!: string;

  constructor(translation: string, entry: Entry) {
    super();
    this.translation = translation;
    this.entry = entry;
  }
}
