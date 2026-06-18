import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Column, UpdateDateColumn } from "typeorm";

import { CreatableEntity } from "./Creatable.entity";

/** Base class providing update tracking columns */
@ObjectType({ isAbstract: true })
export abstract class UpdatableEntity extends CreatableEntity {
  @Field(() => Date)
  @UpdateDateColumn({
    comment: "Timestamp when the record was last updated",
    type: "timestamptz",
  })
  updatedAt!: Date;

  @Column("uuid", {
    comment: "Identifier of the user or process that last updated the record",
    nullable: true,
  })
  @Field(() => ID, { nullable: true })
  updatedBy?: null | string;
}
