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
export type NounGender = (typeof nounGenderValues)[number];

@ObjectType({ implements: Inflection })
@ChildEntity("noun")
export class NounInflection extends Inflection {
  @Field(() => String)
  @Column({ type: "enum", enum: declensionEnumValues, default: "" })
  declension!: NounDeclension;

  @Field(() => String)
  @Column({ type: "enum", enum: nounGenderValues, default: "" })
  gender!: NounGender;

  @Field(() => String, { nullable: true })
  @Column("varchar", { length: 255, nullable: true })
  other?: string;
}
