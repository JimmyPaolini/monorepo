import { Field, ObjectType } from "@nestjs/graphql";
import { ChildEntity, Column } from "typeorm";

import { Inflection } from "./Inflection.entity.js";

export const adverbTypeValues = ["descriptive", "conjunctional", ""] as const;
export type AdverbType = (typeof adverbTypeValues)[number];

export const adverbDegreeValues = [
  "positive",
  "comparative",
  "superlative",
] as const;
export type AdverbDegree = (typeof adverbDegreeValues)[number];

@ObjectType({ implements: Inflection })
@ChildEntity("adverb")
export class AdverbInflection extends Inflection {
  @Field(() => String)
  @Column({ type: "enum", enum: adverbDegreeValues, default: "positive" })
  degree!: AdverbDegree;

  @Field(() => String)
  @Column({
    type: "enum",
    enum: adverbTypeValues,
    default: "",
    name: "adverb_type",
  })
  adverbType!: AdverbType;
}
