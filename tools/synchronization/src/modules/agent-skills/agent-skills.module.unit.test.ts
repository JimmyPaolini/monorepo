import { describe, expect, it } from "vitest";

import { AgentSkillsCommand } from "./agent-skills.command";
import { AgentSkillsModule } from "./agent-skills.module";

describe(AgentSkillsModule, () => {
  it("registers the agent skills command provider", () => {
    const providers = Reflect.getMetadata("providers", AgentSkillsModule) as
      | undefined
      | unknown[];

    expect(providers).toBeDefined();
    expect(providers).toContain(AgentSkillsCommand);
  });
});
