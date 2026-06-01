import { Field, ID, ObjectType } from "@nestjs/graphql";
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";

import { AuditableEntity } from "./Auditable.entity.js";

import type { Lexeme } from "./Lexeme.entity.js";

export const pronunciationVariantValues = [
  "classical",
  "ecclesiastical",
  "vulgar",
] as const;
/**
 *
 */
export type PronunciationVariant = (typeof pronunciationVariantValues)[number];

/**
 *
 */
@ObjectType()
@Entity({
  name: "pronunciations",
  comment:
    "A pronunciation variant (classical, ecclesiastical, or vulgar) for a Latin lexeme",
})
@Unique(["lexeme", "variant"])
export class Pronunciation extends AuditableEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn("uuid", { comment: "Auto-generated UUID" })
  id!: string;

  @Field(() => Object)
  @ManyToOne("Lexeme", "pronunciations", {
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  @JoinColumn()
  lexeme!: Lexeme;

  @Field(() => String)
  @Column({
    type: "enum",
    enum: pronunciationVariantValues,
    comment: "Pronunciation tradition (classical, ecclesiastical, or vulgar)",
  })
  @Index()
  variant!: PronunciationVariant;

  @Field({ nullable: true })
  @Column("varchar", {
    length: 255,
    nullable: true,
    comment: "Phonemic segmentation (e.g. a.moː)",
  })
  @Index()
  phonemes?: string | null;

  @Field({ nullable: true })
  @Column("varchar", {
    length: 255,
    nullable: true,
    comment: "Phonemic IPA transcription (e.g. /ˈaː.moː/)",
  })
  @Index()
  phonemic?: string | null;

  @Field({ nullable: true })
  @Column("varchar", {
    length: 255,
    nullable: true,
    comment: "Phonetic IPA transcription (e.g. [ˈäː.moː])",
  })
  phonetic?: string | null;
}
