import { Field, ObjectType } from "@nestjs/graphql";
import { ChildEntity, Column } from "typeorm";

import { Inflection } from "./Inflection.entity.js";

export const adverbType = {
  conjunctional: "conjunctional",
  descriptive: "descriptive",
  none: "",
} as const;
/**
 *
 */
export type AdverbType = (typeof adverbType)[keyof typeof adverbType];
export const adverbTypes = Object.values(adverbType) as AdverbType[];

export const adverbDegree = {
  comparative: "comparative",
  positive: "positive",
  superlative: "superlative",
} as const;
/**
 *
 */
export type AdverbDegree = (typeof adverbDegree)[keyof typeof adverbDegree];
export const adverbDegrees = Object.values(adverbDegree) as AdverbDegree[];

/**
 *
 */
@ChildEntity("adverb")
@ObjectType({ implements: Inflection })
export class AdverbInflection extends Inflection {
  @Column({
    comment: "Functional type of the adverb (descriptive or conjunctional)",
    default: "",
    enum: adverbTypes,
    type: "enum",
  })
  @Field(() => String)
  adverbType!: AdverbType;

  @Column({
    comment: "Degree of comparison (positive, comparative, superlative)",
    default: "positive",
    enum: adverbDegrees,
    type: "enum",
  })
  @Field(() => String)
  degree!: AdverbDegree;
}
