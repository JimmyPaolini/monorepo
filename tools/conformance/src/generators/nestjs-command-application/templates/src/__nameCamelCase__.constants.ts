import { z } from "zod";

export const environmentSchema = z.object({
  START_DATE: z.string(),
  END_DATE: z.string(),
  LATITUDE: z.coerce.number(),
  LONGITUDE: z.coerce.number(),
  OUTPUT_DIRECTORY: z.string(),
});
