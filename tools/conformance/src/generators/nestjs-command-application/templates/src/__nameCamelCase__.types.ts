import type { z } from "zod";

import { environmentSchema } from "./{{nameCamelCase}}.constants";

export type Environment = z.infer<typeof environmentSchema>;
