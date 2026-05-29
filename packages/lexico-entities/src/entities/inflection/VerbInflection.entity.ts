import { Field, ObjectType } from "@nestjs/graphql";
import { ChildEntity, Column } from "typeorm";

import { Inflection } from "./Inflection.entity.js";

export const verbConjugationValues = [
  "first",
  "second",
  "third",
  "third-io",
  "fourth",
  "",
] as const;
export type VerbConjugation = (typeof verbConjugationValues)[number];

@ObjectType({ implements: Inflection })
@ChildEntity("verb")
export class VerbInflection extends Inflection {
  @Field(() => String)
  @Column({ type: "enum", enum: verbConjugationValues, default: "" })
  conjugation!: VerbConjugation;

  @Field(() => String, { nullable: true })
  @Column("varchar", { length: 255, nullable: true })
  other?: string;
}
