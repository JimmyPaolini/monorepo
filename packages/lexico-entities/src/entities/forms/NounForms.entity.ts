import { ChildEntity, Column } from "typeorm";

import { Forms } from "./Forms.entity.js";

/** Flat representation of a noun's declined forms (7 cases × 2 numbers). */
@ChildEntity("noun")
export class NounForms extends Forms {
  @Column("simple-array", { nullable: true })
  nominativeSingular?: string[];

  @Column("simple-array", { nullable: true })
  nominativePlural?: string[];

  @Column("simple-array", { nullable: true })
  genitiveSingular?: string[];

  @Column("simple-array", { nullable: true })
  genitivePlural?: string[];

  @Column("simple-array", { nullable: true })
  dativeSingular?: string[];

  @Column("simple-array", { nullable: true })
  dativePlural?: string[];

  @Column("simple-array", { nullable: true })
  accusativeSingular?: string[];

  @Column("simple-array", { nullable: true })
  accusativePlural?: string[];

  @Column("simple-array", { nullable: true })
  ablativeSingular?: string[];

  @Column("simple-array", { nullable: true })
  ablativePlural?: string[];

  @Column("simple-array", { nullable: true })
  vocativeSingular?: string[];

  @Column("simple-array", { nullable: true })
  vocativePlural?: string[];

  @Column("simple-array", { nullable: true })
  locativeSingular?: string[];

  @Column("simple-array", { nullable: true })
  locativePlural?: string[];
}
