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
export type VerbConjugation = (typeof verbConjugationValues)[number];

@ChildEntity("verb")
export class VerbInflection extends Inflection {
  @Column({ type: "enum", enum: verbConjugationValues, default: "" })
  conjugation!: VerbConjugation;

  @Column("varchar", { length: 255, nullable: true })
  other?: string;
}
