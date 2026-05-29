import type { environmentSchema } from "./lexicoIngestion.constants";
import type { z } from "zod";

/** Validated environment configuration for the lexico-ingestion application. */
export type Environment = z.infer<typeof environmentSchema>;
