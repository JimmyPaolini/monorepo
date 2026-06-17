import pluralize from "pluralize";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

// ♟️ Constants
import { AdjectivalForm } from "../entities/dictionary/form/AdjectivalForm.entity.js";
import { AdverbForm } from "../entities/dictionary/form/AdverbForm.entity.js";
import { FiniteVerbForm } from "../entities/dictionary/form/FiniteVerbForm.entity.js";
import { Form } from "../entities/dictionary/form/Form.entity.js";
import { GerundForm } from "../entities/dictionary/form/GerundForm.entity.js";
import { InfinitiveForm } from "../entities/dictionary/form/InfinitiveForm.entity.js";
import { NominalForm } from "../entities/dictionary/form/NominalForm.entity.js";
import { ParticipleForm } from "../entities/dictionary/form/ParticipleForm.entity.js";
import { SupineForm } from "../entities/dictionary/form/SupineForm.entity.js";
import { AdjectiveInflection } from "../entities/dictionary/inflection/AdjectiveInflection.entity.js";
import { AdverbInflection } from "../entities/dictionary/inflection/AdverbInflection.entity.js";
import { Inflection } from "../entities/dictionary/inflection/Inflection.entity.js";
import { NounInflection } from "../entities/dictionary/inflection/NounInflection.entity.js";
import { PrepositionInflection } from "../entities/dictionary/inflection/PrepositionInflection.entity.js";
import { UninflectedInflection } from "../entities/dictionary/inflection/Uninflected.entity.js";
import { VerbInflection } from "../entities/dictionary/inflection/VerbInflection.entity.js";
import { Lexeme } from "../entities/dictionary/Lexeme.entity.js";
import { PrincipalPart } from "../entities/dictionary/PrincipalPart.entity.js";
import { Pronunciation } from "../entities/dictionary/Pronunciation.entity.js";
import { Translation } from "../entities/dictionary/Translation.entity.js";
import { Word } from "../entities/dictionary/Word.entity.js";
import { WordForm } from "../entities/dictionary/WordForm.entity.js";
import { WordLexeme } from "../entities/dictionary/WordLexeme.entity.js";
import { Author } from "../entities/literature/Author.entity.js";
import { Line } from "../entities/literature/Line.entity.js";
import { Text } from "../entities/literature/Text.entity.js";
import { Token } from "../entities/literature/Token.entity.js";

export const LEXICO_DATABASE_ENTITIES = [
  Lexeme,
  Inflection,
  NounInflection,
  VerbInflection,
  AdjectiveInflection,
  AdverbInflection,
  PrepositionInflection,
  UninflectedInflection,
  PrincipalPart,
  Pronunciation,
  Word,
  Translation,
  Form,
  NominalForm,
  AdjectivalForm,
  AdverbForm,
  FiniteVerbForm,
  InfinitiveForm,
  ParticipleForm,
  GerundForm,
  SupineForm,
  WordForm,
  WordLexeme,
  Author,
  Text,
  Line,
  Token,
] as const;

/**
 * Custom TypeORM naming strategy that extends SnakeNamingStrategy with:
 * - Automatic pluralization of table names
 * - Join table names formed from the two table names combined alphabetically in snake_case
 */
export class LexicoNamingStrategy extends SnakeNamingStrategy {
  /**
   * Builds a deterministic join table name from both entity table names.
   */
  override joinTableName(
    firstEntityName: string,
    secondEntityName: string,
  ): string {
    const firstTableName = super.tableName(firstEntityName, firstEntityName);
    const secondTableName = super.tableName(secondEntityName, secondEntityName);
    const sortedPluralizedTableNames = [
      pluralize(firstTableName),
      pluralize(secondTableName),
    ].toSorted();
    const joinTableName = sortedPluralizedTableNames.join("_");
    return joinTableName;
  }

  /**
   * Converts a base table name to the pluralized table name used in the schema.
   */
  override tableName(targetName: string, userSpecifiedName: string): string {
    const baseTableName = super.tableName(targetName, userSpecifiedName);
    const tableName = pluralize(baseTableName);
    return tableName;
  }
}
