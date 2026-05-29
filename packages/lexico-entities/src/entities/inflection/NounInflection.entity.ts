import { ChildEntity, Column } from "typeorm";

import { Inflection } from "./Inflection.entity.js";

export const nounDeclensionValues = [
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "",
] as const;
export type NounDeclension = (typeof nounDeclensionValues)[number];

export const nounGenderValues = [
  "masculine",
  "feminine",
  "masc/fem",
  "neuter",
  "",
] as const;
export type NounGender = (typeof nounGenderValues)[number];

@ChildEntity("noun")
export class NounInflection extends Inflection {
  @Column({ type: "enum", enum: nounDeclensionValues, default: "" })
  declension!: NounDeclension;

  @Column({ type: "enum", enum: nounGenderValues, default: "" })
  gender!: NounGender;

  @Column("varchar", { length: 255, nullable: true })
  other?: string;
}
