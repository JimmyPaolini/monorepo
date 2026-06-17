import { Field, ObjectType } from "@nestjs/graphql";
import { ChildEntity, Column } from "typeorm";

import { adjectiveDeclension } from "./AdjectiveInflection.entity.js";
import { Inflection } from "./Inflection.entity.js";

export const nounDeclension = {
  fifth: "fifth",
  first: "first",
  fourth: "fourth",
  none: "",
  second: "second",
  third: "third",
} as const;
/**
 *
 */
export type NounDeclension =
  (typeof nounDeclension)[keyof typeof nounDeclension];
export const nounDeclensionValues = Object.values(
  nounDeclension,
) as NounDeclension[];

export const nounGender = {
  feminine: "feminine",
  mascFem: "masc/fem",
  masculine: "masculine",
  neuter: "neuter",
  none: "",
} as const;
/**
 *
 */
export type NounGender = (typeof nounGender)[keyof typeof nounGender];
export const nounGenders = Object.values(nounGender) as NounGender[];

// Unified DB enum: union of all child-entity declension values (noun + adjective)
export const inflectionDeclension = {
  ...nounDeclension,
  ...adjectiveDeclension,
} as const;
export const inflectionDeclensionValues = Object.values(inflectionDeclension);

/**
 *
 */
@ChildEntity("noun")
@ObjectType({ implements: Inflection })
export class NounInflection extends Inflection {
  @Column({
    comment: "Noun declension class (first through fifth)",
    default: "",
    enum: inflectionDeclensionValues,
    type: "enum",
  })
  @Field(() => String)
  declension!: NounDeclension;

  @Column({
    comment: "Grammatical gender (masculine, feminine, neuter)",
    default: "",
    enum: nounGenders,
    type: "enum",
  })
  @Field(() => String)
  gender!: NounGender;
}
