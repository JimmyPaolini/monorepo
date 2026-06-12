import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Column, CreateDateColumn } from "typeorm";

import { IdentifiableEntity } from "./Identifiable.entity.js";

/** Base class providing creation tracking columns */
@ObjectType({ isAbstract: true })
export abstract class CreatableEntity extends IdentifiableEntity {
  @CreateDateColumn({
    comment: "Timestamp when the record was created",
    type: "timestamptz",
  })
  @Field(() => Date)
  createdAt!: Date;

  @Column("uuid", {
    comment: "Identifier of the user or process that created the record",
    nullable: true,
  })
  @Field(() => ID, { nullable: true })
  createdBy?: null | string;
}
