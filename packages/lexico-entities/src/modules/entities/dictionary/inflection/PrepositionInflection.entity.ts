import { Field, ObjectType } from "@nestjs/graphql";
import { ChildEntity, Column } from "typeorm";

import { Inflection } from "./Inflection.entity.js";

export const prepositionCase = {
  ablative: "ablative",
  accusative: "accusative",
  none: "",
} as const;
/**
 *
 */
export type PrepositionCase =
  (typeof prepositionCase)[keyof typeof prepositionCase];
export const prepositionCases = Object.values(
  prepositionCase,
) as PrepositionCase[];

/**
 *
 */
@ChildEntity("preposition")
@ObjectType({ implements: Inflection })
export class PrepositionInflection extends Inflection {
  @Column({
    comment:
      "Grammatical case governed by the preposition (accusative or ablative)",
    default: "",
    enum: prepositionCases,
    type: "enum",
  })
  @Field(() => String)
  case!: PrepositionCase;

  @Column("text", {
    comment: "Additional inflection notes",
    nullable: true,
  })
  @Field(() => String, { nullable: true })
  other?: string;
}
