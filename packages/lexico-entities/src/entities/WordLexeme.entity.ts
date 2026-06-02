import { Entity, Index, ManyToOne } from "typeorm";

import { AuditableEntity } from "./Auditable.entity.js";

import type { Lexeme } from "./Lexeme.entity.js";
import type { Word } from "./Word.entity.js";

/**
 * Explicit junction entity linking a normalized Latin word string to the
 * lexeme (dictionary entry) it can represent. Replaces an implicit TypeORM
 * join table so the relationship row carries audit columns and a stable UUID.
 */
@Entity({
  name: "word_lexemes",
  schema: "public",
  comment:
    "Junction table linking a normalized Latin word string to the lexemes (dictionary entries) it can represent",
})
@Index(["word", "lexeme"], { unique: true })
export class WordLexeme extends AuditableEntity {
  /** The word string side of the junction. */
  @ManyToOne("Word", "wordLexemes", { nullable: false })
  word!: Word;

  /** The dictionary entry side of the junction. */
  @ManyToOne("Lexeme", "wordLexemes", { nullable: false })
  lexeme!: Lexeme;
}
