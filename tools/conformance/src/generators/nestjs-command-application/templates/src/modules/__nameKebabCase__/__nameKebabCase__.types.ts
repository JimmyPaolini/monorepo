import type { z } from "zod";

import { environmentSchema } from "./{{nameKebabCase}}.constants";

export type Environment = z.infer<typeof environmentSchema>;
