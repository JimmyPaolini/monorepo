import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { DataSource, type DataSourceOptions } from "typeorm";

import {
  LEXICO_DATABASE_ENTITIES,
  lexicoDataSource,
} from "../src/modules/database/data-source";

/** Represents the integration database resources needed by test suites. */
export interface IntegrationTestDatabaseResources {
  readonly dataSource: DataSource;
  readonly stop: () => Promise<void>;
}

/** Defines PostgreSQL connection details used for integration tests. */
interface IntegrationPostgresConnectionOptions {
  readonly databaseName: string;
  readonly image: string;
  readonly password: string;
  readonly username: string;
}

/** Narrows DataSourceOptions to a postgres-only option shape. */
type PostgresDataSourceOptions = Extract<
  DataSourceOptions,
  { type: "postgres" }
>;

/** Creates and initializes an ephemeral PostgreSQL-backed integration DataSource. */
export async function createIntegrationTestDatabaseResources(): Promise<IntegrationTestDatabaseResources> {
  const connectionOptions = getIntegrationPostgresConnectionOptions();
  const baseDataSourceOptions = lexicoDataSource.options;

  if (baseDataSourceOptions.type !== "postgres") {
    throw new Error(
      "Integration test DataSource must be created from postgres options.",
    );
  }

  const postgresBaseDataSourceOptions: PostgresDataSourceOptions =
    baseDataSourceOptions;

  assertSafeIntegrationDatabaseConfiguration(connectionOptions);

  const postgresContainer: StartedPostgreSqlContainer =
    await new PostgreSqlContainer(connectionOptions.image)
      .withDatabase(connectionOptions.databaseName)
      .withUsername(connectionOptions.username)
      .withPassword(connectionOptions.password)
      .start();

  const dataSourceOptions: PostgresDataSourceOptions = {
    ...postgresBaseDataSourceOptions,
    database: postgresContainer.getDatabase(),
    entities: [...LEXICO_DATABASE_ENTITIES],
    host: postgresContainer.getHost(),
    logging: false,
    migrations: [],
    password: postgresContainer.getPassword(),
    port: postgresContainer.getPort(),
    subscribers: [],
    synchronize: false,
    username: postgresContainer.getUsername(),
  };

  const dataSource = new DataSource(dataSourceOptions);

  try {
    await dataSource.initialize();
    await dataSource.synchronize();
  } catch (error) {
    await postgresContainer.stop();
    throw error;
  }

  return {
    dataSource,
    stop: async (): Promise<void> => {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }

      await postgresContainer.stop();
    },
  };
}

/** Guards against unsafe integration database execution contexts. */
function assertSafeIntegrationDatabaseConfiguration(
  connectionOptions: IntegrationPostgresConnectionOptions,
): void {
  if (process.env["NODE_ENV"] === "production") {
    throw new Error(
      "Refusing to run lexico-entities integration tests in production mode.",
    );
  }

  if (
    connectionOptions.databaseName === "postgres" ||
    connectionOptions.databaseName === "template0" ||
    connectionOptions.databaseName === "template1"
  ) {
    throw new Error(
      `Unsafe integration test database '${connectionOptions.databaseName}'. Configure LEXICO_ENTITIES_TEST_POSTGRES_DB.`,
    );
  }
}

/** Resolves integration connection values from dedicated or fallback env vars. */
function getIntegrationPostgresConnectionOptions(): IntegrationPostgresConnectionOptions {
  const databaseName =
    process.env["LEXICO_ENTITIES_TEST_POSTGRES_DB"] ?? "lexico_entities_test";
  const image =
    process.env["LEXICO_ENTITIES_TEST_POSTGRES_IMAGE"] ?? "postgres:16-alpine";
  const password =
    process.env["LEXICO_ENTITIES_TEST_POSTGRES_PASSWORD"] ??
    process.env["POSTGRES_PASSWORD"] ??
    "postgres";
  const username =
    process.env["LEXICO_ENTITIES_TEST_POSTGRES_USER"] ??
    process.env["POSTGRES_USER"] ??
    "postgres";

  return {
    databaseName,
    image,
    password,
    username,
  };
}
