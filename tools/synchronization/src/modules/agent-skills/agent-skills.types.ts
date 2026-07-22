// 🏷️ Types

/** Static mapping between a source skill file and destination agent file. */
export interface AgentFileSyncConfig {
  agentFile: string;
  skillFile: string;
}

/** Parsed skill metadata used to render the AGENTS.md skills table of contents. */
export interface AgentSkillMetadata {
  description: string;
  filePath: string;
  name: string;
}

/** Parsed metadata used to render the custom agents table of contents. */
export interface CustomAgentMetadata {
  description: string;
  fileName: string;
  name: string;
}

/** Parsed frontmatter/body from an existing agent file. */
export interface ExistingAgentParts {
  body: string;
  frontmatter: string;
}

/** Parsed metadata from a SKILL.md file used to populate an agent file. */
export interface SkillSourceMetadata {
  argumentHint: string;
  body: string;
  description: string;
  name: string;
}

/** Options for writing a batch of agent files from skill sources. */
export interface WriteSkillAgentFilesOptions {
  configurations: AgentFileSyncConfig[];
  questionMeMode?: boolean;
  startMessage: string;
  workspaceRoot: string;
}
