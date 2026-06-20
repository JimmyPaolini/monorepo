import "reflect-metadata";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createIntegrationTestDatabaseResources,
  type IntegrationTestDatabaseResources,
} from "../../../testing/integration-test-data-source";

import type { DataSource } from "typeorm";

// cspell:ignore indisunique attname indkey attnum relnamespace indrelid indexrelid attrelid nspname relname indisprimary

interface EntityIntegrationExpectation {
  readonly representativeIndexes: readonly (readonly string[])[];
  readonly representativeUniqueConstraints: readonly (readonly string[])[];
  readonly tableName: string;
}

interface TableIndexSnapshot {
  readonly columnNames: readonly string[];
  readonly isUnique: boolean;
}

const INTEGRATION_SCHEMA_NAME = "public";
const TYPEORM_METADATA_TABLE_NAME = "typeorm_metadata";

const ENTITY_INTEGRATION_EXPECTATIONS: Readonly<
  Record<string, EntityIntegrationExpectation>
> = {
  AdjectivalForm: {
    representativeIndexes: [["lexeme_id"]],
    representativeUniqueConstraints: [],
    tableName: "forms",
  },
  AdjectiveInflection: {
    representativeIndexes: [["type"]],
    representativeUniqueConstraints: [],
    tableName: "inflections",
  },
  AdverbForm: {
    representativeIndexes: [["lexeme_id"]],
    representativeUniqueConstraints: [],
    tableName: "forms",
  },
  AdverbInflection: {
    representativeIndexes: [["type"]],
    representativeUniqueConstraints: [],
    tableName: "inflections",
  },
  Author: {
    representativeIndexes: [],
    representativeUniqueConstraints: [["slug"]],
    tableName: "authors",
  },
  FiniteVerbForm: {
    representativeIndexes: [["lexeme_id"]],
    representativeUniqueConstraints: [],
    tableName: "forms",
  },
  Form: {
    representativeIndexes: [["lexeme_id"]],
    representativeUniqueConstraints: [],
    tableName: "forms",
  },
  GerundForm: {
    representativeIndexes: [["lexeme_id"]],
    representativeUniqueConstraints: [],
    tableName: "forms",
  },
  InfinitiveForm: {
    representativeIndexes: [["lexeme_id"]],
    representativeUniqueConstraints: [],
    tableName: "forms",
  },
  Inflection: {
    representativeIndexes: [["type"]],
    representativeUniqueConstraints: [["lexeme_id"]],
    tableName: "inflections",
  },
  Lexeme: {
    representativeIndexes: [["lemma"]],
    representativeUniqueConstraints: [["disambiguator", "lemma"]],
    tableName: "lexemes",
  },
  Line: {
    representativeIndexes: [["author_id"]],
    representativeUniqueConstraints: [["index", "text_id"]],
    tableName: "lines",
  },
  NominalForm: {
    representativeIndexes: [["lexeme_id"]],
    representativeUniqueConstraints: [],
    tableName: "forms",
  },
  NounInflection: {
    representativeIndexes: [["type"]],
    representativeUniqueConstraints: [],
    tableName: "inflections",
  },
  ParticipleForm: {
    representativeIndexes: [["lexeme_id"]],
    representativeUniqueConstraints: [],
    tableName: "forms",
  },
  PrepositionInflection: {
    representativeIndexes: [["type"]],
    representativeUniqueConstraints: [],
    tableName: "inflections",
  },
  PrincipalPart: {
    representativeIndexes: [["lexeme_id"]],
    representativeUniqueConstraints: [],
    tableName: "principal_parts",
  },
  Pronunciation: {
    representativeIndexes: [["lexeme_id"]],
    representativeUniqueConstraints: [["lexeme_id", "variant"]],
    tableName: "pronunciations",
  },
  SupineForm: {
    representativeIndexes: [["lexeme_id"]],
    representativeUniqueConstraints: [],
    tableName: "forms",
  },
  Text: {
    representativeIndexes: [["author_id"], ["parent_text_id"]],
    representativeUniqueConstraints: [["slug"]],
    tableName: "texts",
  },
  Token: {
    representativeIndexes: [["word_id"]],
    representativeUniqueConstraints: [["index", "line_id"]],
    tableName: "tokens",
  },
  Translation: {
    representativeIndexes: [["lexeme_id"], ["translation_full_text_search"]],
    representativeUniqueConstraints: [],
    tableName: "translations",
  },
  UninflectedInflection: {
    representativeIndexes: [["type"]],
    representativeUniqueConstraints: [],
    tableName: "inflections",
  },
  VerbInflection: {
    representativeIndexes: [["type"]],
    representativeUniqueConstraints: [],
    tableName: "inflections",
  },
  Word: {
    representativeIndexes: [],
    representativeUniqueConstraints: [["data"]],
    tableName: "words",
  },
  WordForm: {
    representativeIndexes: [["form_id"], ["word_id"]],
    representativeUniqueConstraints: [["form_id", "word_id"]],
    tableName: "word_forms",
  },
  WordLexeme: {
    representativeIndexes: [["lexeme_id"], ["word_id"]],
    representativeUniqueConstraints: [["lexeme_id", "word_id"]],
    tableName: "word_lexemes",
  },
};

let integrationDataSource: DataSource;
let integrationTestDatabaseResources:
  | IntegrationTestDatabaseResources
  | undefined;

async function getTableIndexes(
  dataSource: DataSource,
  schemaName: string,
  tableName: string,
): Promise<readonly TableIndexSnapshot[]> {
  const queryResult: unknown = await dataSource.query(
    `
      SELECT
        index_definition.indisunique AS "isUnique",
        json_agg(attribute.attname ORDER BY array_position(index_definition.indkey, attribute.attnum)) AS "columnNames"
      FROM pg_class AS table_definition
      INNER JOIN pg_namespace AS namespace_definition
        ON namespace_definition.oid = table_definition.relnamespace
      INNER JOIN pg_index AS index_definition
        ON table_definition.oid = index_definition.indrelid
      INNER JOIN pg_class AS index_class
        ON index_class.oid = index_definition.indexrelid
      INNER JOIN pg_attribute AS attribute
        ON attribute.attrelid = table_definition.oid
       AND attribute.attnum = ANY(index_definition.indkey)
      WHERE namespace_definition.nspname = $1
        AND table_definition.relname = $2
        AND index_definition.indisprimary = FALSE
      GROUP BY index_class.relname, index_definition.indisunique
    `,
    [schemaName, tableName],
  );
  const indexRows = toRecordArray(queryResult);

  return indexRows.map((indexRow) => ({
    columnNames: normalizeStringArray(toStringArray(indexRow["columnNames"])),
    isUnique: toBoolean(indexRow["isUnique"]),
  }));
}

async function getTableNames(
  dataSource: DataSource,
  schemaName: string,
): Promise<readonly string[]> {
  const queryResult: unknown = await dataSource.query(
    `
      SELECT tables.table_name AS "tableName"
      FROM information_schema.tables AS tables
      WHERE tables.table_schema = $1
        AND tables.table_type = 'BASE TABLE'
    `,
    [schemaName],
  );
  const tableRows = toRecordArray(queryResult);

  return normalizeStringArray(
    tableRows.map((tableRow) => {
      const tableName = tableRow["tableName"];

      if (typeof tableName !== "string") {
        throw new TypeError(
          "Expected database query result to include a string table name.",
        );
      }

      return tableName;
    }),
  );
}

async function getTableUniqueConstraints(
  dataSource: DataSource,
  schemaName: string,
  tableName: string,
): Promise<readonly (readonly string[])[]> {
  const queryResult: unknown = await dataSource.query(
    `
      SELECT
        json_agg(key_column_usage.column_name ORDER BY key_column_usage.ordinal_position) AS "columnNames"
      FROM information_schema.table_constraints AS table_constraints
      INNER JOIN information_schema.key_column_usage AS key_column_usage
        ON key_column_usage.constraint_name = table_constraints.constraint_name
       AND key_column_usage.table_name = table_constraints.table_name
       AND key_column_usage.table_schema = table_constraints.table_schema
      WHERE table_constraints.constraint_type = 'UNIQUE'
        AND table_constraints.table_schema = $1
        AND table_constraints.table_name = $2
      GROUP BY table_constraints.constraint_name
    `,
    [schemaName, tableName],
  );
  const uniqueRows = toRecordArray(queryResult);

  return uniqueRows.map((constraintRow) =>
    normalizeStringArray(toStringArray(constraintRow["columnNames"])),
  );
}

function getTableUniqueIndexes(
  indexes: readonly TableIndexSnapshot[],
): readonly (readonly string[])[] {
  return indexes
    .filter((index) => index.isUnique)
    .map((index) => normalizeStringArray(index.columnNames));
}

function isRecordArray(
  value: readonly unknown[],
): value is readonly Record<string, unknown>[] {
  return value.every(
    (entry) =>
      typeof entry === "object" && entry !== null && !Array.isArray(entry),
  );
}

function normalizeStringArray(values: readonly string[]): readonly string[] {
  return [...new Set(values)].toSorted((firstValue, secondValue) =>
    firstValue.localeCompare(secondValue),
  );
}

function toBoolean(value: unknown): boolean {
  if (typeof value !== "boolean") {
    throw new TypeError(
      "Expected database query result to return a boolean value.",
    );
  }

  return value;
}

function toRecordArray(value: unknown): readonly Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    throw new TypeError("Expected database query result to return an array.");
  }

  const unknownEntries: readonly unknown[] = value;

  if (!isRecordArray(unknownEntries)) {
    throw new TypeError(
      "Expected database query result array entries to be plain objects.",
    );
  }

  return unknownEntries;
}

function toStringArray(value: unknown): readonly string[] {
  if (!Array.isArray(value)) {
    throw new TypeError(
      "Expected database query result to return a string array.",
    );
  }

  const unknownEntries: readonly unknown[] = value;

  if (
    !unknownEntries.every((entry): entry is string => typeof entry === "string")
  ) {
    throw new TypeError(
      "Expected database query result array entries to all be strings.",
    );
  }

  return unknownEntries;
}

async function verifyDatabaseSchema(): Promise<void> {
  const tableNames = await getTableNames(
    integrationDataSource,
    INTEGRATION_SCHEMA_NAME,
  );

  expect(tableNames).toContain(TYPEORM_METADATA_TABLE_NAME);

  const relevantTableNames = tableNames.filter(
    (tableName) => tableName !== TYPEORM_METADATA_TABLE_NAME,
  );

  expect(relevantTableNames).toEqual(
    normalizeStringArray(
      Object.values(ENTITY_INTEGRATION_EXPECTATIONS).map(
        (expectation) => expectation.tableName,
      ),
    ),
  );

  for (const expectation of Object.values(ENTITY_INTEGRATION_EXPECTATIONS)) {
    const indexes = await getTableIndexes(
      integrationDataSource,
      INTEGRATION_SCHEMA_NAME,
      expectation.tableName,
    );

    const uniqueConstraints = await getTableUniqueConstraints(
      integrationDataSource,
      INTEGRATION_SCHEMA_NAME,
      expectation.tableName,
    );
    const uniqueIndexes = getTableUniqueIndexes(indexes);

    for (const representativeIndex of expectation.representativeIndexes) {
      expect(
        indexes.some(
          (index) =>
            !index.isUnique &&
            normalizeStringArray(index.columnNames).join(",") ===
              normalizeStringArray(representativeIndex).join(","),
        ),
      ).toBe(true);
    }

    for (const representativeUniqueConstraint of expectation.representativeUniqueConstraints) {
      expect(
        uniqueConstraints.some(
          (uniqueConstraint) =>
            normalizeStringArray(uniqueConstraint).join(",") ===
            normalizeStringArray(representativeUniqueConstraint).join(","),
        ) ||
          uniqueIndexes.some(
            (uniqueIndex) =>
              normalizeStringArray(uniqueIndex).join(",") ===
              normalizeStringArray(representativeUniqueConstraint).join(","),
          ),
      ).toBe(true);
    }
  }
}

describe("entity integration schema", () => {
  beforeAll(async (): Promise<void> => {
    integrationTestDatabaseResources =
      await createIntegrationTestDatabaseResources();
    integrationDataSource = integrationTestDatabaseResources.dataSource;
  }, 30_000);

  afterAll(async (): Promise<void> => {
    if (!integrationTestDatabaseResources) {
      return;
    }

    await integrationTestDatabaseResources.stop();
  });

  it("creates the expected tables, indexes, and uniqueness constraints", async () => {
    await verifyDatabaseSchema();
  });
});

describe("Entity database operations", () => {
  // cspell:ignore Metadatas Participlial

  it("should have all registered entities", () => {
    const entityMetadataList = integrationDataSource.entityMetadatas;
    expect(entityMetadataList.length).toBeGreaterThan(0);
    expect(
      entityMetadataList.map((entityMetadata) => entityMetadata.name),
    ).toContain("Author");
    expect(
      entityMetadataList.map((entityMetadata) => entityMetadata.name),
    ).toContain("Text");
    expect(
      entityMetadataList.map((entityMetadata) => entityMetadata.name),
    ).toContain("Line");
    expect(
      entityMetadataList.map((entityMetadata) => entityMetadata.name),
    ).toContain("Token");
  });

  it("should retrieve table metadata for all entities", () => {
    const entityMetadataList = integrationDataSource.entityMetadatas;
    const tableNames = entityMetadataList.map(
      (entityMetadata) => entityMetadata.tableName,
    );

    expect(tableNames).toContain("authors");
    expect(tableNames).toContain("texts");
    expect(tableNames).toContain("lines");
    expect(tableNames).toContain("tokens");
    expect(tableNames).toContain("words");
    expect(tableNames).toContain("lexemes");
  });

  it("should define relationships on Text entity", () => {
    const textMetadata = integrationDataSource.getMetadata("Text");
    const relations = textMetadata.relations;

    expect(
      relations.some((relation) => relation.propertyName === "author"),
    ).toBe(true);
    expect(
      relations.some((relation) => relation.propertyName === "lines"),
    ).toBe(true);
  });

  it("should define relationships on Token entity", () => {
    const tokenMetadata = integrationDataSource.getMetadata("Token");
    const relations = tokenMetadata.relations;

    expect(relations.some((relation) => relation.propertyName === "line")).toBe(
      true,
    );
    expect(relations.some((relation) => relation.propertyName === "text")).toBe(
      true,
    );
    expect(relations.some((relation) => relation.propertyName === "word")).toBe(
      true,
    );
  });
});
