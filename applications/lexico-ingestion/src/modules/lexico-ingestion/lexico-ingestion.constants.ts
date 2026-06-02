import { z } from "zod";

export const environmentSchema = z.object({
  POSTGRES_HOST: z.string().default("localhost"),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_USER: z.string().default("postgres"),
  POSTGRES_PASSWORD: z.string().default("postgres"),
  POSTGRES_DB: z.string().default("postgres"),
});

/** Validated environment variables inferred from `environmentSchema`. */
export type Environment = z.infer<typeof environmentSchema>;

/**
 * Sentinel UUID identifying the lexico-ingestion process as the author of
 * all records it creates or updates. Used for `createdBy` / `updatedBy`.
 */
export const LEXICO_INGESTION_BY_ID = "02e585d7-e8b0-412c-b9a8-0e5a65820ea7";
