import { Field, ObjectType } from "@nestjs/graphql";
import { ChildEntity, Column } from "typeorm";

import { Inflection } from "./Inflection.entity.js";

export const prepositionCaseValues = ["accusative", "ablative", ""] as const;
export type PrepositionCase = (typeof prepositionCaseValues)[number];

@ObjectType({ implements: Inflection })
@ChildEntity("preposition")
export class PrepositionInflection extends Inflection {
  @Field(() => String)
  @Column({
    type: "enum",
    enum: prepositionCaseValues,
    default: "",
    comment:
      "Grammatical case governed by the preposition (accusative or ablative)",
  })
  case!: PrepositionCase;

  @Field(() => String, { nullable: true })
  @Column("varchar", {
    length: 255,
    nullable: true,
    comment: "Additional inflection notes",
  })
  other?: string;
}
