import { z } from "zod";

export const environmentSchema = z.object({
  INPUT_SOURCE_TYPE: z.string().default("wiktionary-latin"),
  INPUT_SOURCE_PATH: z.string().default("./data/wiktionary-latin-entry.md"),
  POSTGRES_HOST: z.string().default("localhost"),
  POSTGRES_PORT: z.coerce.number().int().positive().default(5432),
  POSTGRES_USER: z.string().default("postgres"),
  POSTGRES_PASSWORD: z.string().default("postgres"),
  POSTGRES_DATABASE: z.string().default("lexico_ingestion"),
});
