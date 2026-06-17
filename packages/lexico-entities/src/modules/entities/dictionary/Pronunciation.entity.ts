import { Field, ObjectType } from "@nestjs/graphql";
import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from "typeorm";

import { AuditableEntity } from "../base/Auditable.entity.js";

import type { Lexeme } from "./Lexeme.entity.js";

export const pronunciationVariant = {
  classical: "classical",
  ecclesiastical: "ecclesiastical",
  vulgar: "vulgar",
} as const;

/**
 *
 */
export type PronunciationVariant =
  (typeof pronunciationVariant)[keyof typeof pronunciationVariant];

export const pronunciationVariants = Object.values(
  pronunciationVariant,
) as PronunciationVariant[];

/**
 *
 */
@Entity({
  comment:
    "A pronunciation variant (classical, ecclesiastical, or vulgar) for a Latin lexeme",
  name: "pronunciations",
  schema: "public",
})
@ObjectType()
@Unique(["lexeme", "variant"])
export class Pronunciation extends AuditableEntity {
  @Field(() => Object)
  @Index()
  @JoinColumn()
  @ManyToOne("Lexeme", "pronunciations", {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  lexeme!: Lexeme;

  @Column("text", {
    comment: "Phonemic segmentation (e.g. a.moː)",
    nullable: true,
  })
  @Field({ nullable: true })
  @Index()
  phonemes?: null | string;

  @Column("text", {
    comment: "Phonemic IPA transcription (e.g. /ˈaː.moː/)",
    nullable: true,
  })
  @Field({ nullable: true })
  @Index()
  phonemic?: null | string;

  @Column("text", {
    comment: "Phonetic IPA transcription (e.g. [ˈäː.moː])",
    nullable: true,
  })
  @Field({ nullable: true })
  phonetic?: null | string;

  @Column({
    comment: "Pronunciation tradition (classical, ecclesiastical, or vulgar)",
    enum: pronunciationVariants,
    type: "enum",
  })
  @Field(() => String)
  @Index()
  variant!: PronunciationVariant;
}
