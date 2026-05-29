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
@Entity()
export class Word extends BaseEntity {
  @Field()
  @PrimaryColumn()
  word!: string;

  @Field(() => [Entry])
  @ManyToMany(() => Entry, (entry) => entry.words, {
    eager: true,
    cascade: true,
  })
  @JoinTable()
  entries!: Entry[];
}
