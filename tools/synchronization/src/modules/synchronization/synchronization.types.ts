import type { environmentSchema } from "./synchronization.constants";
import type { z } from "zod";

/** Validated environment variables shape inferred from the Zod schema. */
export type Environment = z.infer<typeof environmentSchema>;
