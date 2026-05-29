import { ChildEntity, Column } from "typeorm";

import { Inflection } from "./Inflection.entity.js";

export type AdverbType = string;

export const adverbDegreeValues = [
  "positive",
  "comparative",
  "superlative",
] as const;
export type AdverbDegree = (typeof adverbDegreeValues)[number];

@ChildEntity("adverb")
export class AdverbInflection extends Inflection {
  @Column({ type: "enum", enum: adverbDegreeValues, default: "positive" })
  degree!: AdverbDegree;

  @Column("varchar", { length: 255, default: "" })
  type!: AdverbType;
}
