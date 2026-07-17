// ♟️ Constants

import type { PlanAgentConfig } from "./plan-agents.types";

/** Static per-agent configurations that drive the plan-agents sync. */
export const PLAN_AGENT_CONFIGS: PlanAgentConfig[] = [
  {
    agentFile: ".github/agents/change-plan.agent.md",
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
    agentFile: ".github/agents/explore-files.agent.md",
    handoffs: [],
    infer: false,
    model: "claude-haiku-4.5",
    skillFile: "documentation/skills/explore-files/SKILL.md",
    tools: ["read", "search"],
  },
  {
    agentFile: ".github/agents/research-sources.agent.md",
    handoffs: [],
    infer: false,
    model: "claude-haiku-4.5",
    skillFile: "documentation/skills/research-sources/SKILL.md",
    tools: ["read", "search", "web"],
  },
  {
    agentFile: ".github/agents/update-plan.agent.md",
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
