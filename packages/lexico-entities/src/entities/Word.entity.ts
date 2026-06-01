import { Field, ObjectType } from "@nestjs/graphql";
import {
  BaseEntity,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryColumn,
} from "typeorm";

import { Entry } from "./Entry.entity.js";

@ObjectType()
@Entity({
  name: "words",
  comment: "A Latin word string that maps to one or more dictionary entries",
})
export class Word extends BaseEntity {
  @Field()
  @PrimaryColumn({ comment: "The Latin word as written" })
  word!: string;

  @Field(() => [Entry])
  @ManyToMany(() => Entry, (entry) => entry.words, {
    eager: true,
    cascade: true,
  })
  @JoinTable()
  entries!: Entry[];
}
