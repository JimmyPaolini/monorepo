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
