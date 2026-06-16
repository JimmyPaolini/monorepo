import { Field, ObjectType } from "@nestjs/graphql";
import { ChildEntity, Column } from "typeorm";

import { Inflection } from "./Inflection.entity.js";

export const adverbTypeValues = ["descriptive", "conjunctional", ""] as const;
/**
 *
 */
export type AdverbType = (typeof adverbTypeValues)[number];

export const adverbDegreeValues = [
  "positive",
  "comparative",
  "superlative",
] as const;
/**
 *
 */
export type AdverbDegree = (typeof adverbDegreeValues)[number];

/**
 *
 */
@ChildEntity("adverb")
@ObjectType({ implements: Inflection })
export class AdverbInflection extends Inflection {
  @Column({
    comment: "Functional type of the adverb (descriptive or conjunctional)",
    default: "",
    enum: adverbTypeValues,
    name: "adverb_type",
    type: "enum",
  })
  @Field(() => String)
  adverbType!: AdverbType;

  @Column({
    comment: "Degree of comparison (positive, comparative, superlative)",
    default: "positive",
    enum: adverbDegreeValues,
    type: "enum",
  })
  @Field(() => String)
  degree!: AdverbDegree;
}
