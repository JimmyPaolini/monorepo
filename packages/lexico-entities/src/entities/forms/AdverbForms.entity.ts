import { Field, ObjectType } from "@nestjs/graphql";
import { ChildEntity, Column } from "typeorm";

import { Forms } from "./Forms.entity.js";

/** Adverb forms for positive, comparative, and superlative degrees. */
@ObjectType({ implements: Forms })
@ChildEntity("adverb")
export class AdverbForms extends Forms {
  @Field(() => [String], { nullable: true })
  @Column("simple-array", {
    nullable: true,
    comment: "Comparative degree adverb forms",
  })
  comparative?: string[];

  @Field(() => [String], { nullable: true })
  @Column("simple-array", {
    nullable: true,
    comment: "Positive degree adverb forms",
  })
  positive?: string[];

  @Field(() => [String], { nullable: true })
  @Column("simple-array", {
    nullable: true,
    comment: "Superlative degree adverb forms",
  })
  superlative?: string[];
}
