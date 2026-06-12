import { Entity, Index, ManyToOne } from "typeorm";

import { AuditableEntity } from "../Auditable.entity.js";

import type { Form } from "./form/Form.entity.js";
import type { Word } from "./Word.entity.js";

/**
 * Explicit junction entity linking a normalized Latin word string to the
 * morphological form it can surface as. Replaces an implicit TypeORM join
 * table so the relationship row carries audit columns and a stable UUID.
 *
 * When a Form row is deleted (e.g., during re-ingestion of a lexeme), the
 * database cascades the delete to its WordForm rows automatically.
 */
@Entity({
  comment:
    "Junction table linking a normalized Latin word string to the morphological forms it can surface as",
  name: "word_forms",
  schema: "public",
})
@Index(["word", "form"], { unique: true })
export class WordForm extends AuditableEntity {
  /** The morphological form side of the junction. Cascade-deletes with the Form. */
  @Index()
  @ManyToOne("Form", "wordForms", {
    nullable: false,
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  form!: Form;

  /** The word string side of the junction. */
  @Index()
  @ManyToOne("Word", "wordForms", {
    nullable: false,
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  })
  word!: Word;
}
