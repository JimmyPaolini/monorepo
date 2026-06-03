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
@ObjectType({ implements: Inflection })
@ChildEntity("adjective")
export class AdjectiveInflection extends Inflection {
  @Field(() => String)
  @Column({
    type: "enum",
    enum: declensionEnumValues,
    default: "",
    comment: "Adjective declension class (first/second or third)",
  })
  declension!: AdjectiveDeclension;

  @Field(() => String)
  @Column({
    type: "enum",
    enum: adjectiveDegreeValues,
    default: "positive",
    comment: "Degree of comparison (positive, comparative, superlative)",
  })
  degree!: AdjectiveDegree;

  @Field(() => String, { nullable: true })
  @Column("text", {
    nullable: true,
    comment: "Additional inflection notes",
  })
  other?: string;
}
