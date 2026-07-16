// 🏷️ Types

/** Static per-agent configuration stored in constants alongside each SKILL.md source. */
export interface PlanAgentConfig {
  /** Output agent file path relative to the workspace root. */
  agentFile: string;
  /** Handoff buttons shown after a response completes (VS Code 1.106+ only). */
  handoffs: PlanAgentHandoff[];
  /** When false, Copilot will not auto-activate this agent based on context. */
  infer: boolean;
  /** AI model identifier used for this agent. */
  model: string;
  /** Source SKILL.md file path relative to the workspace root. */
  skillFile: string;
  /** Tool names or aliases available to this agent. */
  tools: string[];
}

/** A single handoff button configuration for a plan agent. */
export interface PlanAgentHandoff {
  /** Target agent identifier (the filename without `.agent.md`). */
  agent: string;
  /** Label text shown on the handoff button in the chat interface. */
  label: string;
  /** Pre-filled prompt text sent to the target agent. */
  prompt: string;
  /** Whether to auto-submit the prompt without user review. */
  send: boolean;
}

/** Dynamic metadata extracted from a SKILL.md frontmatter block. */
export interface PlanAgentSkillMetadata {
  /** Argument hint from SKILL.md frontmatter, shown in the chat input. */
  argumentHint: string;
  /** Full body content from SKILL.md (everything after the closing frontmatter `---`). */
  body: string;
  /** Description from SKILL.md frontmatter. */
  description: string;
  /** Name from SKILL.md frontmatter. */
  name: string;
}
