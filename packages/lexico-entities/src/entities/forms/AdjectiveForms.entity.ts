import { Field, ObjectType } from "@nestjs/graphql";
import { ChildEntity, Column } from "typeorm";

import { Forms } from "./Forms.entity.js";

@ObjectType()
export class AdjectiveNumber {
  @Field(() => [String], { nullable: true })
  singular?: string[];

  @Field(() => [String], { nullable: true })
  plural?: string[];
}

@ObjectType()
export class AdjectiveCaseForms {
  @Field(() => AdjectiveNumber, { nullable: true })
  nominative?: AdjectiveNumber;

  @Field(() => AdjectiveNumber, { nullable: true })
  genitive?: AdjectiveNumber;

  @Field(() => AdjectiveNumber, { nullable: true })
  dative?: AdjectiveNumber;

  @Field(() => AdjectiveNumber, { nullable: true })
  accusative?: AdjectiveNumber;

  @Field(() => AdjectiveNumber, { nullable: true })
  ablative?: AdjectiveNumber;

  @Field(() => AdjectiveNumber, { nullable: true })
  vocative?: AdjectiveNumber;

  @Field(() => AdjectiveNumber, { nullable: true })
  locative?: AdjectiveNumber;
}

/** Adjective forms keyed by gender, then case, then number. */
@ObjectType({ implements: Forms })
@ChildEntity("adjective")
export class AdjectiveForms extends Forms {
  @Field(() => AdjectiveCaseForms, { nullable: true })
  @Column("json", { nullable: true })
  feminine?: AdjectiveCaseForms | null;

  @Field(() => AdjectiveCaseForms, { nullable: true })
  @Column("json", { nullable: true })
  masculine?: AdjectiveCaseForms | null;

  @Field(() => AdjectiveCaseForms, { nullable: true })
  @Column("json", { nullable: true })
  neuter?: AdjectiveCaseForms | null;
}
