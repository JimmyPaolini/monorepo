// ♟️ Constants

import type { PlanAgentConfig } from "./plan-agents.types";

/** All files managed by the plan-agents sync workflow. */
export const SYNC_PLAN_AGENTS_FILES: string[] = [
  ".github/agents/change-plan.agent.md",
  ".github/agents/create-plan.agent.md",
  ".github/agents/execute-plan.agent.md",
  ".github/agents/update-plan.agent.md",
  "documentation/skills/change-plan/SKILL.md",
  "documentation/skills/create-plan/SKILL.md",
  "documentation/skills/execute-plan/SKILL.md",
  "documentation/skills/update-plan/SKILL.md",
];

/** Static per-agent configurations that drive the plan-agents sync. */
export const PLAN_AGENT_CONFIGS: PlanAgentConfig[] = [
  {
    agentFile: ".github/agents/change-plan.agent.md",
    agents: ["explore-codebase", "explore-internet"],
    handoffs: [
      {
        agent: "execute-plan",
        label: "Execute Plan",
        prompt: "Execute the revised plan.",
        send: false,
      },
    ],
    infer: false,
    model: "claude-sonnet-4.5",
    skillFile: "documentation/skills/change-plan/SKILL.md",
    tools: ["read", "edit", "search"],
  },
  {
    agentFile: ".github/agents/create-plan.agent.md",
    agents: ["explore-codebase", "explore-internet"],
    handoffs: [
      {
        agent: "execute-plan",
        label: "Execute Plan",
        prompt: "Execute the plan created above.",
        send: false,
      },
    ],
    infer: false,
    model: "claude-sonnet-4.5",
    skillFile: "documentation/skills/create-plan/SKILL.md",
    tools: ["read", "search", "web", "execute"],
  },
  {
    agentFile: ".github/agents/execute-plan.agent.md",
    agents: ["explore-codebase"],
    handoffs: [
      {
        agent: "update-plan",
        label: "Update Plan",
        prompt: "Update the plan to reflect what was actually implemented.",
        send: false,
      },
    ],
    infer: false,
    model: "claude-sonnet-4.5",
    skillFile: "documentation/skills/execute-plan/SKILL.md",
    tools: ["read", "edit", "search", "execute", "agent"],
  },
  {
    agentFile: ".github/agents/explore-codebase.agent.md",
    agents: [],
    handoffs: [],
    infer: false,
    model: "claude-haiku-4.5",
    skillFile: "documentation/skills/explore-codebase/SKILL.md",
    tools: ["read", "search"],
  },
  {
    agentFile: ".github/agents/explore-internet.agent.md",
    agents: [],
    handoffs: [],
    infer: false,
    model: "claude-haiku-4.5",
    skillFile: "documentation/skills/explore-internet/SKILL.md",
    tools: ["read", "search", "web"],
  },
  {
    agentFile: ".github/agents/update-plan.agent.md",
    agents: ["explore-codebase"],
    handoffs: [
      {
        agent: "execute-plan",
        label: "Continue Executing",
        prompt: "Continue executing the remaining tasks in the updated plan.",
        send: false,
      },
      {
        agent: "change-plan",
        label: "Change Plan",
        prompt: "Change the plan scope or approach.",
        send: false,
      },
    ],
    infer: false,
    model: "claude-sonnet-4.5",
    skillFile: "documentation/skills/update-plan/SKILL.md",
    tools: ["read", "edit", "search", "execute", "agent"],
  },
];
