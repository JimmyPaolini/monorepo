import { Field, ObjectType } from "@nestjs/graphql";
import { ChildEntity, Column } from "typeorm";

import { Inflection } from "./Inflection.entity.js";
import { declensionEnumValues } from "./NounInflection.entity.js";

export const adjectiveDeclensionValues = ["first/second", "third", ""] as const;
/**
 *
 */
export type AdjectiveDeclension = (typeof adjectiveDeclensionValues)[number];

export const adjectiveDegreeValues = [
  "positive",
  "comparative",
  "superlative",
] as const;
/**
 *
 */
export type AdjectiveDegree = (typeof adjectiveDegreeValues)[number];

/**
 *
 */
@ChildEntity("adjective")
@ObjectType({ implements: Inflection })
export class AdjectiveInflection extends Inflection {
  @Column({
    comment: "Adjective declension class (first/second or third)",
    default: "",
    enum: declensionEnumValues,
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

  @Column("text", {
    comment: "Additional inflection notes",
    nullable: true,
  })
  @Field(() => String, { nullable: true })
  other?: string;
}
