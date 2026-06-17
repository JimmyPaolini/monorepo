import { InterfaceType } from "@nestjs/graphql";
import { Entity, Index, ManyToOne, OneToMany, TableInheritance } from "typeorm";

import { AuditableEntity } from "../../base/Auditable.entity.js";

import type { Lexeme } from "../Lexeme.entity.js";
import type { WordForm } from "../WordForm.entity.js";

/**
 * Supported grammatical case values for forms.
 */
export const formCase = {
  ablative: "ablative",
  accusative: "accusative",
  dative: "dative",
  genitive: "genitive",
  nominative: "nominative",
} as const;
/**
 * Union of allowed form case values.
 */
export type FormCase = (typeof formCase)[keyof typeof formCase];

export const formCaseValues = Object.values(formCase) as FormCase[];

export const formNumber = {
  plural: "plural",
  singular: "singular",
} as const;
/**
 * Union of allowed grammatical number values.
 */
export type FormNumber = (typeof formNumber)[keyof typeof formNumber];
export const formNumberValues = Object.values(formNumber) as FormNumber[];

export const formGender = {
  feminine: "feminine",
  masculine: "masculine",
  neuter: "neuter",
} as const;
/**
 * Union of allowed grammatical gender values.
 */
export type FormGender = (typeof formGender)[keyof typeof formGender];
export const formGenderValues = Object.values(formGender) as FormGender[];

export const formMood = {
  imperative: "imperative",
  indicative: "indicative",
  subjunctive: "subjunctive",
} as const;
/**
 * Union of allowed grammatical mood values.
 */
export type FormMood = (typeof formMood)[keyof typeof formMood];
export const formMoodValues = Object.values(formMood) as FormMood[];

export const formVoice = {
  active: "active",
  passive: "passive",
} as const;
/**
 * Union of allowed grammatical voice values.
 */
export type FormVoice = (typeof formVoice)[keyof typeof formVoice];
export const formVoiceValues = Object.values(formVoice) as FormVoice[];

export const formTense = {
  future: "future",
  futurePerfect: "futurePerfect",
  imperfect: "imperfect",
  perfect: "perfect",
  pluperfect: "pluperfect",
  present: "present",
} as const;
/**
 * Union of allowed finite tense values.
 */
export type FormTense = (typeof formTense)[keyof typeof formTense];
export const formTenseValues = Object.values(formTense) as FormTense[];

export const formPerson = {
  first: "first",
  second: "second",
  third: "third",
} as const;
/**
 * Union of allowed grammatical person values.
 */
export type FormPerson = (typeof formPerson)[keyof typeof formPerson];
export const formPersonValues = Object.values(formPerson) as FormPerson[];

export const formDegree = {
  comparative: "comparative",
  positive: "positive",
  superlative: "superlative",
} as const;
/**
 * Union of allowed degree-of-comparison values.
 */
export type FormDegree = (typeof formDegree)[keyof typeof formDegree];
export const formDegreeValues = Object.values(formDegree) as FormDegree[];

export const formNonFiniteTense = {
  future: "future",
  perfect: "perfect",
  present: "present",
} as const;
/**
 * Union of allowed non-finite tense values.
 */
export type FormNonFiniteTense =
  (typeof formNonFiniteTense)[keyof typeof formNonFiniteTense];
export const formNonFiniteTenseValues = Object.values(
  formNonFiniteTense,
) as FormNonFiniteTense[];

export const formGerundCase = {
  ablative: "ablative",
  accusative: "accusative",
  dative: "dative",
  genitive: "genitive",
} as const;
/**
 * Union of supported gerund case values.
 */
export type FormGerundCase =
  (typeof formGerundCase)[keyof typeof formGerundCase];
export const formGerundCaseValues = Object.values(
  formGerundCase,
) as FormGerundCase[];

export const formSupineCase = {
  ablative: "ablative",
  accusative: "accusative",
} as const;
/**
 * Union of supported supine case values.
 */
export type FormSupineCase =
  (typeof formSupineCase)[keyof typeof formSupineCase];
export const formSupineCaseValues = Object.values(
  formSupineCase,
) as FormSupineCase[];

/**
 * Base single-table-inheritance entity for all lexical forms.
 */
@Entity({
  comment:
    "Abstract base table for normalized inflected forms using single-table inheritance",
  name: "forms",
  schema: "public",
})
@InterfaceType()
@TableInheritance({ column: { name: "type", type: "text" } })
export class Form extends AuditableEntity {
  // id, createdAt, createdBy, updatedAt, updatedBy, deletedAt, deletedBy inherited from AuditableEntity

  @Index()
  @ManyToOne("Lexeme", "forms", {
    nullable: false,
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  lexeme!: Lexeme;

  // Inverse side of WordForm.form
  @OneToMany("WordForm", "form")
  wordForms!: WordForm[];
}
