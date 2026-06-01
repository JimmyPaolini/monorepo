import { Field, ObjectType } from "@nestjs/graphql";
import { ChildEntity, Column } from "typeorm";

import { declensionEnumValues } from "./NounInflection.entity.js";
import { Inflection } from "./Inflection.entity.js";

export const adjectiveDeclensionValues = ["first/second", "third", ""] as const;
export type AdjectiveDeclension = (typeof adjectiveDeclensionValues)[number];

export const adjectiveDegreeValues = [
  "positive",
  "comparative",
  "superlative",
] as const;
export type AdjectiveDegree = (typeof adjectiveDegreeValues)[number];

@ObjectType({ implements: Inflection })
@ChildEntity("adjective")
export class AdjectiveInflection extends Inflection {
  @Field(() => String)
  @Column({ type: "enum", enum: declensionEnumValues, default: "" })
  declension!: AdjectiveDeclension;

  @Field(() => String)
  @Column({ type: "enum", enum: adjectiveDegreeValues, default: "positive" })
  degree!: AdjectiveDegree;

  @Field(() => String, { nullable: true })
  @Column("varchar", { length: 255, nullable: true })
  other?: string;
}
