import { Field, ObjectType } from "@nestjs/graphql";
import { ChildEntity, Column } from "typeorm";

import { Inflection } from "./Inflection.entity.js";

export const prepositionCaseValues = ["accusative", "ablative", ""] as const;
/**
 *
 */
export type PrepositionCase = (typeof prepositionCaseValues)[number];

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
    enum: prepositionCaseValues,
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
