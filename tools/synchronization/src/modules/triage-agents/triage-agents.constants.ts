// ♟️ Constants

import type { TriageAgentConfig } from "./triage-agents.types";

/** Static per-agent configurations that drive the triage-agents sync. */
export const TRIAGE_AGENT_CONFIGS: TriageAgentConfig[] = [
  {
    agentFile: ".github/agents/triage-deployment.agent.md",
    handoffs: [
      {
        agent: "triage-submission",
        label: "Triage Submission",
        prompt:
          "Also triage any local submission failures (commit or push hooks).",
        send: false,
      },
    ],
    infer: false,
    model: "claude-sonnet-4.5",
    skillFile: "documentation/skills/triage-deployment/SKILL.md",
    tools: ["read", "execute", "search", "web"],
  },
  {
    agentFile: ".github/agents/triage-submission.agent.md",
    handoffs: [
      {
        agent: "triage-deployment",
        label: "Triage Deployment",
        prompt: "Also triage any failing CI checks on the remote branch.",
        send: false,
      },
    ],
    infer: false,
    model: "claude-sonnet-4.5",
    skillFile: "documentation/skills/triage-submission/SKILL.md",
    tools: ["read", "edit", "execute", "search"],
  },
];
