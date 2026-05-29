import { ChildEntity, Column } from "typeorm";

import { Inflection } from "./Inflection.entity.js";

export const adjectiveDeclensionValues = ["first/second", "third", ""] as const;
export type AdjectiveDeclension = (typeof adjectiveDeclensionValues)[number];

export const adjectiveDegreeValues = [
  "positive",
  "comparative",
  "superlative",
] as const;
export type AdjectiveDegree = (typeof adjectiveDegreeValues)[number];

@ChildEntity("adjective")
export class AdjectiveInflection extends Inflection {
  @Column({ type: "enum", enum: adjectiveDeclensionValues, default: "" })
  declension!: AdjectiveDeclension;

  @Column({ type: "enum", enum: adjectiveDegreeValues, default: "positive" })
  degree!: AdjectiveDegree;

  @Column("varchar", { length: 255, nullable: true })
  other?: string;
}
