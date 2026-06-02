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
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid", {
    comment: "Auto-generated UUID primary key",
  })
  id!: string;

  @Field(() => Date)
  @CreateDateColumn({
    type: "timestamptz",
    comment: "Timestamp when the record was created",
  })
  createdAt!: Date;

  @Field(() => ID, { nullable: true })
  @Column("uuid", {
    nullable: true,
    comment: "UUID of the user or process that created the record",
  })
  createdBy?: string | null;

  @Field(() => Date)
  @UpdateDateColumn({
    type: "timestamptz",
    comment: "Timestamp when the record was last updated",
  })
  updatedAt!: Date;

  @Field(() => ID, { nullable: true })
  @Column("uuid", {
    nullable: true,
    comment: "UUID of the user or process that last updated the record",
  })
  updatedBy?: string | null;

  @Field(() => Date, { nullable: true })
  @DeleteDateColumn({
    type: "timestamptz",
    nullable: true,
    comment: "Timestamp when the record was soft-deleted",
  })
  deletedAt?: Date | null;

  @Field(() => ID, { nullable: true })
  @Column("uuid", {
    nullable: true,
    comment: "UUID of the user or process that soft-deleted the record",
  })
  deletedBy?: string | null;
}
