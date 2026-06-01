import { Field, ObjectType } from "@nestjs/graphql";

/**
 *
 */
@ObjectType()
export class AdjectiveNumber {
  @Field(() => [String], { nullable: true }) singular?: string[];
  @Field(() => [String], { nullable: true }) plural?: string[];
}

/**
 *
 */
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

/** Adjective forms keyed by gender → case → number. */
@ObjectType()
export class AdjectiveForms {
  @Field(() => AdjectiveCaseForms, { nullable: true })
  feminine?: AdjectiveCaseForms | null;

  @Field(() => AdjectiveCaseForms, { nullable: true })
  masculine?: AdjectiveCaseForms | null;

  @Field(() => AdjectiveCaseForms, { nullable: true })
  neuter?: AdjectiveCaseForms | null;
}
