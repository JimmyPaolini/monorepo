import { ChildEntity, Column } from "typeorm";

import { Inflection } from "./Inflection.entity.js";

@ChildEntity("preposition")
export class PrepositionInflection extends Inflection {
  @Column("varchar", { length: 63, default: "" })
  case!: string;
}
