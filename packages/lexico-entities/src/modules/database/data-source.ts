import "reflect-metadata";
import { DataSource } from "typeorm";

import {
  LEXICO_DATABASE_ENTITIES,
  LexicoNamingStrategy,
} from "./database.constants.js";

export const lexicoDataSource = new DataSource({
  database: process.env["POSTGRES_DB"] ?? "postgres",
  entities: [...LEXICO_DATABASE_ENTITIES],
  host: process.env["POSTGRES_HOST"] ?? "localhost",
  logging: false,
  migrations: ["src/database/migrations/*.ts"],
  namingStrategy: new LexicoNamingStrategy(),
  password: process.env["POSTGRES_PASSWORD"] ?? "postgres",
  port: Number(process.env["POSTGRES_PORT"] ?? 5432),
  schema: "public",
  synchronize: false,
  type: "postgres",
  username: process.env["POSTGRES_USER"] ?? "postgres",
});
