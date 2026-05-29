import { ChildEntity, Column } from "typeorm";

import { Forms } from "./Forms.entity.js";

export interface AdjectiveCaseForms {
  nominative?: { singular?: string[]; plural?: string[] };
  genitive?: { singular?: string[]; plural?: string[] };
  dative?: { singular?: string[]; plural?: string[] };
  accusative?: { singular?: string[]; plural?: string[] };
  ablative?: { singular?: string[]; plural?: string[] };
  vocative?: { singular?: string[]; plural?: string[] };
  locative?: { singular?: string[]; plural?: string[] };
}

/** Adjective forms keyed by gender, then case, then number. */
@ChildEntity("adjective")
export class AdjectiveForms extends Forms {
  @Column("json", { nullable: true })
  feminine?: AdjectiveCaseForms | null;

  @Column("json", { nullable: true })
  masculine?: AdjectiveCaseForms | null;

  @Column("json", { nullable: true })
  neuter?: AdjectiveCaseForms | null;
}
