import { z } from 'zod';

export const environmentSchema = z.object({
  DATABASE_HOST: z.string().default('localhost'),
  DATABASE_PORT: z.coerce.number().default(5432),
  DATABASE_USER: z.string().default('lexico'),
  DATABASE_PASSWORD: z.string().default('lexico'),
  DATABASE_NAME: z.string().default('lexico'),
});

export type Environment = z.infer<typeof environmentSchema>;
