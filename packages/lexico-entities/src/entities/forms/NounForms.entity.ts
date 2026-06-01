import { Field, ObjectType } from "@nestjs/graphql";
import { ChildEntity, Column } from "typeorm";

import { Forms } from "./Forms.entity.js";

/** Flat representation of a noun's declined forms (7 cases × 2 numbers). */
@ObjectType({ implements: Forms })
@ChildEntity("noun")
export class NounForms extends Forms {
  @Field(() => [String], { nullable: true })
  @Column("simple-array", { nullable: true, comment: "Ablative plural forms" })
  ablativePlural?: string[];

  @Field(() => [String], { nullable: true })
  @Column("simple-array", {
    nullable: true,
    comment: "Ablative singular forms",
  })
  ablativeSingular?: string[];

  @Field(() => [String], { nullable: true })
  @Column("simple-array", {
    nullable: true,
    comment: "Accusative plural forms",
  })
  accusativePlural?: string[];

  @Field(() => [String], { nullable: true })
  @Column("simple-array", {
    nullable: true,
    comment: "Accusative singular forms",
  })
  accusativeSingular?: string[];

  @Field(() => [String], { nullable: true })
  @Column("simple-array", { nullable: true, comment: "Dative plural forms" })
  dativePlural?: string[];

  @Field(() => [String], { nullable: true })
  @Column("simple-array", { nullable: true, comment: "Dative singular forms" })
  dativeSingular?: string[];

  @Field(() => [String], { nullable: true })
  @Column("simple-array", { nullable: true, comment: "Genitive plural forms" })
  genitivePlural?: string[];

  @Field(() => [String], { nullable: true })
  @Column("simple-array", {
    nullable: true,
    comment: "Genitive singular forms",
  })
  genitiveSingular?: string[];

  @Field(() => [String], { nullable: true })
  @Column("simple-array", { nullable: true, comment: "Locative plural forms" })
  locativePlural?: string[];

  @Field(() => [String], { nullable: true })
  @Column("simple-array", {
    nullable: true,
    comment: "Locative singular forms",
  })
  locativeSingular?: string[];

  @Field(() => [String], { nullable: true })
  @Column("simple-array", {
    nullable: true,
    comment: "Nominative plural forms",
  })
  nominativePlural?: string[];

  @Field(() => [String], { nullable: true })
  @Column("simple-array", {
    nullable: true,
    comment: "Nominative singular forms",
  })
  nominativeSingular?: string[];

  @Field(() => [String], { nullable: true })
  @Column("simple-array", { nullable: true, comment: "Vocative plural forms" })
  vocativePlural?: string[];

  @Field(() => [String], { nullable: true })
  @Column("simple-array", {
    nullable: true,
    comment: "Vocative singular forms",
  })
  vocativeSingular?: string[];
}
