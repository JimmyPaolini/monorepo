import { describe, expect, it } from "vitest";

import { LEXICO_DATABASE_ENTITIES } from "../database/data-source";

import type { EntityClass } from "./testing/entity-definition-assertions";

interface EntityColumnExpectation {
  readonly isNullable?: boolean;
  readonly primary?: boolean;
  readonly type?: string;
}

interface EntityDefinitionExpectation {
  readonly columns: Readonly<Record<string, EntityColumnExpectation>>;
  readonly entityClass: EntityClass;
  readonly indexes: readonly EntityIndexExpectation[];
  readonly inheritance?: EntityInheritanceExpectation;
  readonly primaryKeyPropertyNames: readonly string[];
  readonly relations: Readonly<Record<string, EntityRelationExpectation>>;
  readonly tableName?: string;
  readonly uniqueConstraints: readonly (readonly string[])[];
}

interface EntityIndexExpectation {
  readonly isUnique?: boolean;
  readonly propertyNames: readonly string[];
}

interface EntityInheritanceExpectation {
  readonly discriminatorColumnName?: string;
  readonly discriminatorValue?: string;
  readonly strategy?: "child-entity" | "single-table";
}

interface EntityRelationExpectation {
  readonly inverseEntityName?: string;
  readonly kind?: "many-to-many" | "many-to-one" | "one-to-many" | "one-to-one";
  readonly nullable?: boolean;
  readonly onDelete?: string;
}

function createEntityExpectation(
  entityClass: EntityClass,
): EntityDefinitionExpectation {
  return {
    columns: {},
    entityClass,
    indexes: [],
    primaryKeyPropertyNames: [],
    relations: {},
    uniqueConstraints: [],
  };
}

export const ENTITY_EXPECTATIONS = Object.fromEntries(
  LEXICO_DATABASE_ENTITIES.map((entityClass) => [
    entityClass.name,
    createEntityExpectation(entityClass),
  ]),
) satisfies Record<string, EntityDefinitionExpectation>;

describe("ENTITY_EXPECTATIONS", () => {
  it("covers every registered entity exactly once", () => {
    expect(Object.keys(ENTITY_EXPECTATIONS).sort()).toEqual(
      LEXICO_DATABASE_ENTITIES.map((entityClass) => entityClass.name).sort(),
    );
  });

  it("defines a canonical entity expectation surface", () => {
    for (const entityExpectation of Object.values(ENTITY_EXPECTATIONS)) {
      expect(entityExpectation.entityClass.name).toBeTypeOf("string");
      expect(entityExpectation.columns).toEqual({});
      expect(entityExpectation.relations).toEqual({});
      expect(entityExpectation.indexes).toEqual([]);
      expect(entityExpectation.uniqueConstraints).toEqual([]);
      expect(entityExpectation.primaryKeyPropertyNames).toEqual([]);
    }
  });
});
