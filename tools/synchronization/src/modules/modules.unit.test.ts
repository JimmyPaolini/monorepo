import { describe, expect, it } from "vitest";

import { AgentSkillsModule } from "./agent-skills/agent-skills.module";
import { ConformanceGeneratorsModule } from "./conformance-generators/conformance-generators.module";
import { ConventionalConfigModule } from "./conventional-config/conventional-config.module";
import { DevcontainerConfigurationModule } from "./devcontainer-configuration/devcontainer-configuration.module";
import { LoggerModule } from "./logger/logger.module";
import { PullRequestTemplateModule } from "./pull-request-template/pull-request-template.module";
import { SynchronizationModule } from "./synchronization/synchronization.module";

describe("module definitions", () => {
  it("exports all synchronization modules", () => {
    expect(AgentSkillsModule).toBeDefined();
    expect(ConformanceGeneratorsModule).toBeDefined();
    expect(ConventionalConfigModule).toBeDefined();
    expect(DevcontainerConfigurationModule).toBeDefined();
    expect(LoggerModule).toBeDefined();
    expect(PullRequestTemplateModule).toBeDefined();
    expect(SynchronizationModule).toBeDefined();
  });
});
