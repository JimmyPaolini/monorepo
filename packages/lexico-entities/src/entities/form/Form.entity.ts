import { InterfaceType } from "@nestjs/graphql";
import { Entity, Index, ManyToOne, OneToMany, TableInheritance } from "typeorm";

import { AuditableEntity } from "../Auditable.entity.js";

import type { Lexeme } from "../Lexeme.entity.js";
import type { WordForm } from "../WordForm.entity.js";

/**
 *
 */
export const formCaseValues = [
  "nominative",
  "genitive",
  "dative",
  "accusative",
  "ablative",
  "vocative",
  "locative",
] as const;
/**
 *
 */
export type FormCase = (typeof formCaseValues)[number];

export const formNumberValues = ["singular", "plural"] as const;
/**
 *
 */
export type FormNumber = (typeof formNumberValues)[number];

export const formGenderValues = ["masculine", "feminine", "neuter"] as const;
/**
 *
 */
export type FormGender = (typeof formGenderValues)[number];

export const formMoodValues = [
  "indicative",
  "subjunctive",
  "imperative",
] as const;
/**
 *
 */
export type FormMood = (typeof formMoodValues)[number];

export const formVoiceValues = ["active", "passive"] as const;
/**
 *
 */
export type FormVoice = (typeof formVoiceValues)[number];

export const formTenseValues = [
  "present",
  "imperfect",
  "future",
  "perfect",
  "pluperfect",
  "futurePerfect",
] as const;
/**
 *
 */
export type FormTense = (typeof formTenseValues)[number];

export const formPersonValues = ["first", "second", "third"] as const;
/**
 *
 */
export type FormPerson = (typeof formPersonValues)[number];

export const formDegreeValues = [
  "positive",
  "comparative",
  "superlative",
] as const;
/**
 *
 */
export type FormDegree = (typeof formDegreeValues)[number];

export const formNonFiniteTenseValues = [
  "present",
  "perfect",
  "future",
] as const;
/**
 *
 */
export type FormNonFiniteTense = (typeof formNonFiniteTenseValues)[number];

export const formGerundCaseValues = [
  "genitive",
  "dative",
  "accusative",
  "ablative",
] as const;
/**
 *
 */
export type FormGerundCase = (typeof formGerundCaseValues)[number];

export const formSupineCaseValues = ["accusative", "ablative"] as const;
/**
 *
 */
export type FormSupineCase = (typeof formSupineCaseValues)[number];

/**
 *
 */
@InterfaceType()
@Entity({
  name: "forms",
  schema: "public",
  comment:
    "Abstract base table for normalized inflected forms using single-table inheritance",
})
@TableInheritance({ column: { type: "text", name: "type" } })
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
