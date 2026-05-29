import { Field, ObjectType } from "@nestjs/graphql";
import { ChildEntity, Column } from "typeorm";

import { Forms } from "./Forms.entity.js";

/** Flat representation of a noun's declined forms (7 cases × 2 numbers). */
@ObjectType({ implements: Forms })
@ChildEntity("noun")
export class NounForms extends Forms {
  @Field(() => [String], { nullable: true })
  @Column("simple-array", { nullable: true })
  ablativePlural?: string[];

  @Field(() => [String], { nullable: true })
  @Column("simple-array", { nullable: true })
  ablativeSingular?: string[];

  @Field(() => [String], { nullable: true })
  @Column("simple-array", { nullable: true })
  accusativePlural?: string[];

  @Field(() => [String], { nullable: true })
  @Column("simple-array", { nullable: true })
  accusativeSingular?: string[];

  @Field(() => [String], { nullable: true })
  @Column("simple-array", { nullable: true })
  dativePlural?: string[];

  @Field(() => [String], { nullable: true })
  @Column("simple-array", { nullable: true })
  dativeSingular?: string[];

  @Field(() => [String], { nullable: true })
  @Column("simple-array", { nullable: true })
  genitivePlural?: string[];

  @Field(() => [String], { nullable: true })
  @Column("simple-array", { nullable: true })
  genitiveSingular?: string[];

  @Field(() => [String], { nullable: true })
  @Column("simple-array", { nullable: true })
  locativePlural?: string[];

  @Field(() => [String], { nullable: true })
  @Column("simple-array", { nullable: true })
  locativeSingular?: string[];

  @Field(() => [String], { nullable: true })
  @Column("simple-array", { nullable: true })
  nominativePlural?: string[];

  @Field(() => [String], { nullable: true })
  @Column("simple-array", { nullable: true })
  nominativeSingular?: string[];

  @Field(() => [String], { nullable: true })
  @Column("simple-array", { nullable: true })
  vocativePlural?: string[];

  @Field(() => [String], { nullable: true })
  @Column("simple-array", { nullable: true })
  vocativeSingular?: string[];
}
