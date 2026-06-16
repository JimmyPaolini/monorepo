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
/**
 *
 */
export type VerbConjugation = (typeof verbConjugationValues)[number];

/**
 *
 */
@ChildEntity("verb")
@ObjectType({ implements: Inflection })
export class VerbInflection extends Inflection {
  @Column({
    comment: "Verb conjugation class (first through fourth)",
    default: "",
    enum: verbConjugationValues,
    type: "enum",
  })
  @Field(() => String)
  conjugation!: VerbConjugation;

  @Column("text", {
    comment: "Additional inflection notes",
    nullable: true,
  })
  @Field(() => String, { nullable: true })
  other?: string;
}
