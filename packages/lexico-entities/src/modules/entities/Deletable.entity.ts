import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Column, DeleteDateColumn } from "typeorm";

import { UpdatableEntity } from "./Updatable.entity.js";

/** Base class providing deletion tracking columns */
@ObjectType({ isAbstract: true })
export abstract class DeletableEntity extends UpdatableEntity {
  @DeleteDateColumn({
    comment: "Timestamp when the record was soft-deleted",
    nullable: true,
    type: "timestamptz",
  })
  @Field(() => Date, { nullable: true })
  deletedAt?: Date | null;

  @Column("uuid", {
    comment: "Identifier of the user or process that soft-deleted the record",
    nullable: true,
  })
  @Field(() => ID, { nullable: true })
  deletedBy?: null | string;
}
