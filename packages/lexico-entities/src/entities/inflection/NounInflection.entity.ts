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
export type NounDeclension = (typeof nounDeclensionValues)[number];

export const nounGenderValues = [
  "masculine",
  "feminine",
  "masc/fem",
  "neuter",
  "",
] as const;
export type NounGender = (typeof nounGenderValues)[number];

@ObjectType({ implements: Inflection })
@ChildEntity("noun")
export class NounInflection extends Inflection {
  @Field(() => String)
  @Column({ type: "enum", enum: nounDeclensionValues, default: "" })
  declension!: NounDeclension;

  @Field(() => String)
  @Column({ type: "enum", enum: nounGenderValues, default: "" })
  gender!: NounGender;

  @Field(() => String, { nullable: true })
  @Column("varchar", { length: 255, nullable: true })
  other?: string;
}
