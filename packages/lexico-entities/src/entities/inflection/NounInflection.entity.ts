import { Field, ObjectType } from "@nestjs/graphql";
import { ChildEntity, Column } from "typeorm";

import { Inflection } from "./Inflection.entity.js";

export const nounDeclensionValues = [
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "",
] as const;
/**
 *
 */
export type NounDeclension = (typeof nounDeclensionValues)[number];

// Unified DB enum: union of all child-entity declension values (noun + adjective)
export const declensionEnumValues = [
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "first/second",
  "",
] as const;

export const nounGenderValues = [
  "masculine",
  "feminine",
  "masc/fem",
  "neuter",
  "",
] as const;
/**
 *
 */
export type NounGender = (typeof nounGenderValues)[number];

/**
 *
 */
@ChildEntity("noun")
@ObjectType({ implements: Inflection })
export class NounInflection extends Inflection {
  @Column({
    comment: "Noun declension class (first through fifth)",
    default: "",
    enum: declensionEnumValues,
    type: "enum",
  })
  @Field(() => String)
  declension!: NounDeclension;

  @Column({
    comment: "Grammatical gender (masculine, feminine, neuter)",
    default: "",
    enum: nounGenderValues,
    type: "enum",
  })
  @Field(() => String)
  gender!: NounGender;

  @Column("text", {
    comment: "Additional inflection notes",
    nullable: true,
  })
  @Field(() => String, { nullable: true })
  other?: string;
}
