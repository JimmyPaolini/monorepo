import { Field, ObjectType } from "@nestjs/graphql";
import { ChildEntity, Column } from "typeorm";

import { Inflection } from "./Inflection.entity.js";
import { inflectionDeclensionValues } from "./NounInflection.entity.js";

export const adjectiveDeclension = {
  firstSecond: "first/second",
  none: "",
  third: "third",
};
/**
 * Union of adjective declension values.
 */
export type AdjectiveDeclension =
  (typeof adjectiveDeclension)[keyof typeof adjectiveDeclension];
export const adjectiveDeclensionValues = Object.values(adjectiveDeclension);

export const adjectiveDegree = {
  comparative: "comparative",
  positive: "positive",
  superlative: "superlative",
} as const;
/**
 * Union of adjective degree values.
 */
export type AdjectiveDegree =
  (typeof adjectiveDegree)[keyof typeof adjectiveDegree];
export const adjectiveDegreeValues = Object.values(
  adjectiveDegree,
) as AdjectiveDegree[];

/**
 * Inflection metadata for adjective lexemes.
 */
@ChildEntity("adjective")
@ObjectType({ implements: Inflection })
export class AdjectiveInflection extends Inflection {
  @Column({
    comment: "Adjective declension class (first/second or third)",
    default: "",
    enum: inflectionDeclensionValues,
    type: "enum",
  })
  @Field(() => String)
  declension!: AdjectiveDeclension;

  @Column({
    comment: "Degree of comparison (positive, comparative, superlative)",
    default: "positive",
    enum: adjectiveDegreeValues,
    type: "enum",
  })
  @Field(() => String)
  degree!: AdjectiveDegree;
}
