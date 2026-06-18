import { Field, ID, ObjectType } from "@nestjs/graphql";
import { BaseEntity, PrimaryGeneratedColumn } from "typeorm";

/** Base class providing a UUID primary key and audit trail columns for all content-bearing entities. */
@ObjectType({ isAbstract: true })
export abstract class IdentifiableEntity extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid", {
    comment: "Auto-generated UUID primary key",
  })
  id!: string;
}
