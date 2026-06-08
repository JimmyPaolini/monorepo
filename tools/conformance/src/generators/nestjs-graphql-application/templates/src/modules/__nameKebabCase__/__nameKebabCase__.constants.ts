import { z } from "zod";

// 🌱 Add environment schema fields here
export const environmentSchema = z.object({
  PORT: z.coerce.number().optional().default(3000),
});
