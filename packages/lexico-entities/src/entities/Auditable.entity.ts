import { Field, ObjectType } from "@nestjs/graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  UpdateDateColumn,
} from "typeorm";

/** Base class providing audit trail columns for all content-bearing entities. */
@ObjectType({ isAbstract: true })
export abstract class AuditableEntity extends BaseEntity {
  @Field(() => Date)
  @CreateDateColumn({
    comment: "Timestamp when the record was created",
  })
  createdAt!: Date;

  @Field(() => String, { nullable: true })
  @Column("varchar", {
    length: 255,
    nullable: true,
    comment: "User or process that created the record",
  })
  createdBy?: string | null;

  @Field(() => Date)
  @UpdateDateColumn({
    comment: "Timestamp when the record was last updated",
  })
  updatedAt!: Date;

  @Field(() => String, { nullable: true })
  @Column("varchar", {
    length: 255,
    nullable: true,
    comment: "User or process that last updated the record",
  })
  updatedBy?: string | null;

  @Field(() => Date, { nullable: true })
  @DeleteDateColumn({
    nullable: true,
    comment: "Timestamp when the record was soft-deleted",
  })
  deletedAt?: Date | null;

  @Field(() => String, { nullable: true })
  @Column("varchar", {
    length: 255,
    nullable: true,
    comment: "User or process that soft-deleted the record",
  })
  deletedBy?: string | null;
}
