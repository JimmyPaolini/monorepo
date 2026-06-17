import { Field, ObjectType } from "@nestjs/graphql";
import { ChildEntity, Column } from "typeorm";

import { Inflection } from "./Inflection.entity.js";

export const verbConjugation = {
  first: "first",
  fourth: "fourth",
  none: "",
  second: "second",
  third: "third",
  thirdIo: "third-io",
} as const;
/**
 * Union of verb conjugation values.
 */
export type VerbConjugation =
  (typeof verbConjugation)[keyof typeof verbConjugation];
export const verbConjugationValues = Object.values(
  verbConjugation,
) as VerbConjugation[];

/**
 * Inflection metadata for verb lexemes.
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
