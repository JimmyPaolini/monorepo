// 🏷️ Types

/** Metadata for a conformance generator rendered in the AGENTS.md table. */
export interface ConformanceGeneratorMetadata {
  aliases: string[];
  description: string;
  name: string;
}

/** Shape of tools/conformance/generators.json consumed by this sync command. */
export interface ConformanceGeneratorsJson {
  generators: Record<
    string,
    { aliases?: string[]; description: string; factory: string; schema: string }
  >;
}
