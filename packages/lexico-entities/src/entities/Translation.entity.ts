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
@Entity({
  name: "translations",
  comment: "An English translation of a Latin dictionary entry",
})
export class Translation extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid", { comment: "Auto-generated UUID" })
  id!: string;

  @Field(() => Object)
  @ManyToOne("Entry", "translations", {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn()
  entry!: Entry;

  @Field()
  @Column("varchar", { length: 2047, comment: "English translation text" })
  translation!: string;

  constructor(translation: string, entry?: Entry) {
    super();
    this.translation = translation;
    if (entry) this.entry = entry;
  }
}
