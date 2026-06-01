import { Field, ObjectType } from "@nestjs/graphql";

/** Adverb forms for positive, comparative, and superlative degrees. */
@ObjectType()
export class AdverbForms {
  @Field(() => [String], { nullable: true }) positive?: string[];
  @Field(() => [String], { nullable: true }) comparative?: string[];
  @Field(() => [String], { nullable: true }) superlative?: string[];
}
