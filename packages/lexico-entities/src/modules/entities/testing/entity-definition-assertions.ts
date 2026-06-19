import { getMetadataArgsStorage } from "typeorm";

/**
 *
 */
export type EntityClass = abstract new (
  ...constructorArguments: readonly unknown[]
) => object;
/**
 *
 */
type EntityIndexMetadata = MetadataStorage["indices"][number];
/**
 *
 */
type EntityRelationMetadata = MetadataStorage["relations"][number];
/**
 *
 */
type EntityTableMetadata = MetadataStorage["tables"][number];
/**
 *
 */
type EntityUniqueMetadata = MetadataStorage["uniques"][number];

/**
 *
 */
type IndexOptionKey = Extract<
  keyof EntityIndexMetadata,
  | "background"
  | "concurrent"
  | "expireAfterSeconds"
  | "fulltext"
  | "nullFiltered"
  | "parser"
  | "sparse"
  | "spatial"
  | "synchronize"
  | "unique"
  | "where"
>;

/**
 *
 */
type IndexOptions = Pick<EntityIndexMetadata, IndexOptionKey>;
/**
 *
 */
type MetadataStorage = ReturnType<typeof getMetadataArgsStorage>;
/**
 *
 */
type PropertyNameSelector =
  | EntityIndexMetadata["columns"]
  | EntityUniqueMetadata["columns"];

/**
 *
 */
type RelationOptions = NonNullable<EntityRelationMetadata["options"]>;

/**
 *
 */
type RelationOptionSubset = Pick<
  RelationOptions,
  "cascade" | "eager" | "nullable" | "onDelete" | "orphanedRowAction"
>;

/**
 *
 */
export function assertExactSet<TValue>(
  actualValues: Iterable<TValue>,
  expectedValues: Iterable<TValue>,
  options: {
    readonly label: string;
    readonly toComparableString: (value: TValue) => string;
  },
): void {
  const actualComparableValues = toSortedUniqueStrings(
    [...actualValues].map(options.toComparableString),
  );
  const expectedComparableValues = toSortedUniqueStrings(
    [...expectedValues].map(options.toComparableString),
  );

  if (
    !areExactStringSetsEqual(actualComparableValues, expectedComparableValues)
  ) {
    throw new Error(
      [
        `Set assertion failed for ${options.label}.`,
        `Expected: ${expectedComparableValues.join(", ") || "<empty>"}`,
        `Received: ${actualComparableValues.join(", ") || "<empty>"}`,
      ].join("\n"),
    );
  }
}

/**
 *
 */
export function findEntityIndexByPropertyNames(
  entityClass: EntityClass,
  propertyNames: readonly string[],
): EntityIndexMetadata | undefined {
  const normalizedPropertyNames = toSortedUniqueStrings(propertyNames);

  return getEntityIndexes(entityClass).find((indexMetadata) =>
    areExactStringSetsEqual(
      extractPropertyNames(
        indexMetadata.columns,
        `${getEntityName(entityClass)} index`,
      ),
      normalizedPropertyNames,
    ),
  );
}

/**
 *
 */
export function findEntityUniqueByPropertyNames(
  entityClass: EntityClass,
  propertyNames: readonly string[],
): EntityUniqueMetadata | undefined {
  const normalizedPropertyNames = toSortedUniqueStrings(propertyNames);

  return getEntityUniques(entityClass).find((uniqueMetadata) =>
    areExactStringSetsEqual(
      extractPropertyNames(
        uniqueMetadata.columns,
        `${getEntityName(entityClass)} unique constraint`,
      ),
      normalizedPropertyNames,
    ),
  );
}

/**
 *
 */
export function getEntityIndexes(
  entityClass: EntityClass,
): readonly EntityIndexMetadata[] {
  return getStorage()
    .indices.filter((indexMetadata) =>
      isMatchingEntityTarget(indexMetadata.target, entityClass),
    )
    .sort((firstIndex, secondIndex) => {
      const firstIndexColumns = extractPropertyNames(
        firstIndex.columns,
        `${getEntityName(entityClass)} index`,
      ).join(",");
      const secondIndexColumns = extractPropertyNames(
        secondIndex.columns,
        `${getEntityName(entityClass)} index`,
      ).join(",");

      return firstIndexColumns.localeCompare(secondIndexColumns);
    });
}

/**
 *
 */
export function getEntityRelations(
  entityClass: EntityClass,
): readonly EntityRelationMetadata[] {
  const relations = getStorage()
    .relations.filter((relation) =>
      isMatchingEntityTarget(relation.target, entityClass),
    )
    .sort((firstRelation, secondRelation) =>
      firstRelation.propertyName.localeCompare(secondRelation.propertyName),
    );

  return relations;
}

/**
 *
 */
export function getEntityTableMetadata(
  entityClass: EntityClass,
): EntityTableMetadata {
  const tableMetadata = getStorage().tables.find((table) =>
    isMatchingEntityTarget(table.target, entityClass),
  );

  return assertRequiredMetadata(
    tableMetadata,
    `Missing table metadata for entity ${getEntityName(entityClass)}.`,
  );
}

/**
 *
 */
export function getEntityUniques(
  entityClass: EntityClass,
): readonly EntityUniqueMetadata[] {
  return getStorage()
    .uniques.filter((uniqueMetadata) =>
      isMatchingEntityTarget(uniqueMetadata.target, entityClass),
    )
    .sort((firstUnique, secondUnique) => {
      const firstUniqueColumns = extractPropertyNames(
        firstUnique.columns,
        `${getEntityName(entityClass)} unique constraint`,
      ).join(",");
      const secondUniqueColumns = extractPropertyNames(
        secondUnique.columns,
        `${getEntityName(entityClass)} unique constraint`,
      ).join(",");

      return firstUniqueColumns.localeCompare(secondUniqueColumns);
    });
}

/**
 *
 */
function areExactStringSetsEqual(
  actualValues: Iterable<string>,
  expectedValues: Iterable<string>,
): boolean {
  const actualSet = toSortedUniqueStrings(actualValues);
  const expectedSet = toSortedUniqueStrings(expectedValues);

  if (actualSet.length !== expectedSet.length) {
    return false;
  }

  return actualSet.every(
    (actualValue, index) => actualValue === expectedSet[index],
  );
}

/**
 *
 */
function assertEntityHasIndex(
  entityClass: EntityClass,
  propertyNames: readonly string[],
  expectedOptions?: Partial<IndexOptions>,
): EntityIndexMetadata {
  const indexMetadata = findEntityIndexByPropertyNames(
    entityClass,
    propertyNames,
  );
  const resolvedIndexMetadata = assertRequiredMetadata(
    indexMetadata,
    `Missing index on [${toSortedUniqueStrings(propertyNames).join(", ")}] for entity ${getEntityName(entityClass)}.`,
  );

  if (expectedOptions !== undefined) {
    for (const optionName of Object.keys(
      expectedOptions,
    ) as (keyof IndexOptions)[]) {
      const expectedValue = expectedOptions[optionName];
      const actualValue = resolvedIndexMetadata[optionName];

      if (toStableString(actualValue) !== toStableString(expectedValue)) {
        throw new Error(
          [
            `Index option assertion failed for entity ${getEntityName(entityClass)}.`,
            `Index columns: [${toSortedUniqueStrings(propertyNames).join(", ")}]`,
            `Option: ${String(optionName)}`,
            `Expected: ${toStableString(expectedValue)}`,
            `Received: ${toStableString(actualValue)}`,
          ].join("\n"),
        );
      }
    }
  }

  return resolvedIndexMetadata;
}

/**
 *
 */
function assertEntityHasTableMetadata(entityClass: EntityClass): void {
  void getEntityTableMetadata(entityClass);
}

/**
 *
 */
function assertEntityHasUnique(
  entityClass: EntityClass,
  propertyNames: readonly string[],
): EntityUniqueMetadata {
  const uniqueMetadata = findEntityUniqueByPropertyNames(
    entityClass,
    propertyNames,
  );

  return assertRequiredMetadata(
    uniqueMetadata,
    `Missing unique constraint on [${toSortedUniqueStrings(propertyNames).join(", ")}] for entity ${getEntityName(entityClass)}.`,
  );
}

/**
 *
 */
function assertEntityRegistryMatches(
  actualEntities: readonly EntityClass[],
  expectedEntities: readonly EntityClass[],
): void {
  assertExactSet(actualEntities, expectedEntities, {
    label: "entity registry class names",
    toComparableString: (entityClass) => entityClass.name,
  });

  const duplicateEntityNames = [
    ...new Set(
      actualEntities
        .map((entityClass) => entityClass.name)
        .filter(
          (entityName, entityIndex, entityNames) =>
            entityNames.indexOf(entityName) !== entityIndex,
        ),
    ),
  ].sort((firstEntityName, secondEntityName) =>
    firstEntityName.localeCompare(secondEntityName),
  );

  if (duplicateEntityNames.length > 0) {
    throw new Error(
      `Entity registry contains duplicate classes: ${duplicateEntityNames.join(", ")}`,
    );
  }
}

/**
 *
 */
function assertRelationOptions(
  relationMetadata: EntityRelationMetadata,
  expectedOptions: Partial<RelationOptionSubset>,
): void {
  const actualOptions = relationMetadata.options;

  for (const optionName of Object.keys(
    expectedOptions,
  ) as (keyof RelationOptionSubset)[]) {
    const expectedValue = expectedOptions[optionName];
    const actualValue = actualOptions?.[optionName];

    if (
      optionName === "cascade" &&
      (Array.isArray(expectedValue) || Array.isArray(actualValue))
    ) {
      const expectedCascadeValues = Array.isArray(expectedValue)
        ? expectedValue
        : expectedValue === true
          ? ["insert", "update", "remove", "soft-remove", "recover"]
          : [];
      const actualCascadeValues = Array.isArray(actualValue)
        ? actualValue
        : actualValue === true
          ? ["insert", "update", "remove", "soft-remove", "recover"]
          : [];

      if (
        !areExactStringSetsEqual(actualCascadeValues, expectedCascadeValues)
      ) {
        throw new Error(
          [
            `Relation option assertion failed for '${relationMetadata.propertyName}'.`,
            `Option: cascade`,
            `Expected: ${expectedCascadeValues.join(", ") || "<empty>"}`,
            `Received: ${actualCascadeValues.join(", ") || "<empty>"}`,
          ].join("\n"),
        );
      }

      continue;
    }

    if (toStableString(actualValue) !== toStableString(expectedValue)) {
      throw new Error(
        [
          `Relation option assertion failed for '${relationMetadata.propertyName}'.`,
          `Option: ${String(optionName)}`,
          `Expected: ${toStableString(expectedValue)}`,
          `Received: ${toStableString(actualValue)}`,
        ].join("\n"),
      );
    }
  }
}

/**
 *
 */
function assertRequiredMetadata<T>(
  value: T | undefined,
  failureMessage: string,
): T {
  if (value === undefined) {
    throw new Error(failureMessage);
  }

  return value;
}

/**
 *
 */
function extractPropertyNames(
  columnsOrFactory: PropertyNameSelector,
  contextLabel: string,
): readonly string[] {
  if (columnsOrFactory === undefined) {
    return [];
  }

  if (Array.isArray(columnsOrFactory)) {
    return toSortedUniqueStrings(columnsOrFactory);
  }

  throw new Error(
    `Expected static column names for ${contextLabel}, but received a dynamic column selector.`,
  );
}

/**
 *
 */
function getEntityName(entityClass: EntityClass): string {
  return entityClass.name;
}

/**
 *
 */
function getEntityRelationMetadata(
  entityClass: EntityClass,
  relationPropertyName: string,
): EntityRelationMetadata {
  const relationMetadata = getEntityRelations(entityClass).find(
    (relation) => relation.propertyName === relationPropertyName,
  );

  return assertRequiredMetadata(
    relationMetadata,
    `Missing relation '${relationPropertyName}' for entity ${getEntityName(entityClass)}.`,
  );
}

/**
 *
 */
function getStorage(): MetadataStorage {
  return getMetadataArgsStorage();
}

/**
 *
 */
function isMatchingEntityTarget(
  target: EntityIndexMetadata["target"],
  entityClass: EntityClass,
): boolean {
  if (target === entityClass) {
    return true;
  }

  if (typeof target === "function") {
    return target.name === entityClass.name;
  }

  return false;
}

/**
 *
 */
function toSortedUniqueStrings(values: Iterable<string>): readonly string[] {
  return [...new Set(values)].sort((firstValue, secondValue) =>
    firstValue.localeCompare(secondValue),
  );
}

/**
 *
 */
function toStableString(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => toStableString(item)).join(",")}]`;
  }

  if (value === null) {
    return "null";
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([firstKey], [secondKey]) => firstKey.localeCompare(secondKey),
    );

    return `{${entries
      .map(
        ([entryKey, entryValue]) => `${entryKey}:${toStableString(entryValue)}`,
      )
      .join(",")}}`;
  }

  return String(value);
}
