import pluralize from "pluralize";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

/**
 * Custom TypeORM naming strategy that extends SnakeNamingStrategy with:
 * - Automatic pluralization of table names
 * - Join table names formed from the two table names combined alphabetically in snake_case
 */
export class LexicoNamingStrategy extends SnakeNamingStrategy {
  /**
   *
   */
  override joinTableName(
    firstEntityName: string,
    secondEntityName: string,
  ): string {
    const first = super.tableName(firstEntityName, firstEntityName);
    const second = super.tableName(secondEntityName, secondEntityName);
    const sorted = [pluralize(first), pluralize(second)].toSorted();
    const joinTableName = sorted.join("_");
    return joinTableName;
  }

  /**
   *
   */
  override tableName(targetName: string, userSpecifiedName: string): string {
    const base = super.tableName(targetName, userSpecifiedName);
    const tableName = pluralize(base);
    return tableName;
  }
}
