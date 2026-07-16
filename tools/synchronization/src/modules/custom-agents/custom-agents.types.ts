// 🏷️ Types

/** Metadata extracted from a single `.agent.md` file. */
export interface CustomAgentMetadata {
  /** Description from agent frontmatter. */
  description: string;
  /** File name of the agent file (for link construction). */
  fileName: string;
  /** Name from agent frontmatter, or filename stem when the field is absent. */
  name: string;
}
