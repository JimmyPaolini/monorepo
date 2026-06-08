import { Field, ID, ObjectType } from "@nestjs/graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

/** Base class providing a UUID primary key and audit trail columns for all content-bearing entities. */
@ObjectType({ isAbstract: true })
export abstract class AuditableEntity extends BaseEntity {
  @CreateDateColumn({
    comment: "Timestamp when the record was created",
    type: "timestamptz",
  })
  @Field(() => Date)
  createdAt!: Date;

  @Column("uuid", {
    comment: "UUID of the user or process that created the record",
    nullable: true,
  })
  @Field(() => ID, { nullable: true })
  createdBy?: null | string;

  @DeleteDateColumn({
    comment: "Timestamp when the record was soft-deleted",
    nullable: true,
    type: "timestamptz",
  })
  @Field(() => Date, { nullable: true })
  deletedAt?: Date | null;

  @Column("uuid", {
    comment: "UUID of the user or process that soft-deleted the record",
    nullable: true,
  })
  @Field(() => ID, { nullable: true })
  deletedBy?: null | string;

  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid", {
    comment: "Auto-generated UUID primary key",
  })
  id!: string;

  @Field(() => Date)
  @UpdateDateColumn({
    comment: "Timestamp when the record was last updated",
    type: "timestamptz",
  })
  updatedAt!: Date;

  @Column("uuid", {
    comment: "UUID of the user or process that last updated the record",
    nullable: true,
  })
  @Field(() => ID, { nullable: true })
  updatedBy?: null | string;
}
