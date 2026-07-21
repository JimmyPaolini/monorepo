// ♟️ Constants

import type { AgentFileSyncConfig } from "./agent-skills.types";

/** Directory containing all custom GitHub Copilot agent definition files. */
export const AGENTS_DIRECTORY = ".github/agents";

/** Root AGENTS.md file path. */
export const AGENTS_MD_FILE = "AGENTS.md";

/** Start marker for the custom agents table of contents in AGENTS.md. */
export const CUSTOM_AGENTS_TOC_START =
  "<!-- custom-agents-table-of-contents start -->";

/** End marker for the custom agents table of contents in AGENTS.md. */
export const CUSTOM_AGENTS_TOC_END =
  "<!-- custom-agents-table-of-contents end -->";

/** Start marker for the skill table of contents in AGENTS.md. */
export const AGENT_SKILLS_TOC_START =
  "<!-- agent-skills-table-of-contents start -->";

/** End marker for the skill table of contents in AGENTS.md. */
export const AGENT_SKILLS_TOC_END =
  "<!-- agent-skills-table-of-contents end -->";

/** Skill-to-agent mapping for the question-me agent file. */
export const QUESTION_ME_AGENT_CONFIG: AgentFileSyncConfig = {
  agentFile: ".github/agents/question-me.agent.md",
  skillFile: "documentation/skills/question-me/SKILL.md",
};

/** Skill-to-agent mappings for plan-related agents. */
export const PLAN_AGENT_CONFIGS: AgentFileSyncConfig[] = [
  {
    agentFile: ".github/agents/change-plan.agent.md",
    skillFile: "documentation/skills/change-plan/SKILL.md",
  },
  {
    agentFile: ".github/agents/create-plan.agent.md",
    skillFile: "documentation/skills/create-plan/SKILL.md",
  },
  {
    agentFile: ".github/agents/execute-plan.agent.md",
    skillFile: "documentation/skills/execute-plan/SKILL.md",
  },
  {
    agentFile: ".github/agents/explore-codebase.agent.md",
    skillFile: "documentation/skills/explore-codebase/SKILL.md",
  },
  {
    agentFile: ".github/agents/explore-internet.agent.md",
    skillFile: "documentation/skills/explore-internet/SKILL.md",
  },
  {
    agentFile: ".github/agents/update-plan.agent.md",
    skillFile: "documentation/skills/update-plan/SKILL.md",
  },
];

/** Skill-to-agent mappings for triage agents. */
export const TRIAGE_AGENT_CONFIGS: AgentFileSyncConfig[] = [
  {
    agentFile: ".github/agents/triage-deployment.agent.md",
    skillFile: "documentation/skills/triage-deployment/SKILL.md",
  },
  {
    agentFile: ".github/agents/triage-submission.agent.md",
    skillFile: "documentation/skills/triage-submission/SKILL.md",
  },
];

/** Files managed by the agent-skills sync workflow. */
export const SYNC_AGENT_SKILLS_FILES: string[] = [
  `${AGENTS_DIRECTORY}/*.agent.md`,
  AGENTS_MD_FILE,
  "documentation/skills/**/*.md",
];
