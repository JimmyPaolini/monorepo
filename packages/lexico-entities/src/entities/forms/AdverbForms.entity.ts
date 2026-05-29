import { ChildEntity, Column } from "typeorm";

import { Forms } from "./Forms.entity.js";

/** Adverb forms for positive, comparative, and superlative degrees. */
@ChildEntity("adverb")
export class AdverbForms extends Forms {
  @Column("simple-array", { nullable: true })
  positive?: string[];

  @Column("simple-array", { nullable: true })
  comparative?: string[];

  @Column("simple-array", { nullable: true })
  superlative?: string[];
}
