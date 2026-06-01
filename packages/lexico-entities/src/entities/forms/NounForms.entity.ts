import { Field, ObjectType } from "@nestjs/graphql";

/**
 *
 */
@ObjectType()
export class NounNumber {
  @Field(() => [String], { nullable: true }) singular?: string[];
  @Field(() => [String], { nullable: true }) plural?: string[];
}

/**
 *
 */
@ObjectType()
export class NounCaseForms {
  @Field(() => NounNumber, { nullable: true }) nominative?: NounNumber;
  @Field(() => NounNumber, { nullable: true }) genitive?: NounNumber;
  @Field(() => NounNumber, { nullable: true }) dative?: NounNumber;
  @Field(() => NounNumber, { nullable: true }) accusative?: NounNumber;
  @Field(() => NounNumber, { nullable: true }) ablative?: NounNumber;
  @Field(() => NounNumber, { nullable: true }) vocative?: NounNumber;
  @Field(() => NounNumber, { nullable: true }) locative?: NounNumber;
}

/** Noun declined forms keyed by case → singular/plural. */
@ObjectType()
export class NounForms {
  @Field(() => NounCaseForms, { nullable: true })
  cases?: NounCaseForms | null;
}
