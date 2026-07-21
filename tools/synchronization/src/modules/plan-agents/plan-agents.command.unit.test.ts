import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { createMock } from "@golevelup/ts-vitest";
import { Test, type TestingModule } from "@nestjs/testing";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { expectProcessExitOne, mockProcessExit } from "../../../testing/mocks";
import { LoggerService } from "../logger/logger.service";
import { SynchronizationModeService } from "../synchronization/synchronization-mode.service";

import { PlanAgentsCommand } from "./plan-agents.command";
import { PLAN_AGENT_CONFIGS } from "./plan-agents.constants";

import type { PlanAgentConfig } from "./plan-agents.types";

const fileContents = new Map<string, string>();

vi.mock("node:fs", () => {
  return {
    readFileSync: vi.fn<(filePath: string) => string>((filePath: string) => {
      const value = fileContents.get(filePath);
      if (value === undefined) {
        throw new Error(`File not found: ${filePath}`);
      }
      return value;
    }),
    writeFileSync: vi.fn<(filePath: string, content: string) => void>(
      (filePath: string, content: string) => {
        fileContents.set(filePath, content);
      },
    ),
  };
});

/** Builds the expected agent file content for a given config + parsed skill data. */
function buildExpectedAgentContent(
  config: PlanAgentConfig,
  name: string,
  description: string,
  argumentHint: string,
  body: string,
): string {
  const agentsYaml = config.agents.map((agent) => `  - ${agent}`).join("\n");
  const toolsYaml = config.tools.map((tool) => `  - ${tool}`).join("\n");
  const handoffsYaml = config.handoffs
    .map((handoff) =>
      [
        `  - label: ${handoff.label}`,
        `    agent: ${handoff.agent}`,
        `    prompt: "${handoff.prompt}"`,
        `    send: ${handoff.send}`,
      ].join("\n"),
    )
    .join("\n");

  const frontmatter = [
    `description: ${description}`,
    `name: ${name}`,
    `argument-hint: ${argumentHint}`,
    `agents:`,
    agentsYaml,
    `infer: ${config.infer}`,
    `model: ${config.model}`,
    `tools:`,
    toolsYaml,
    `handoffs:`,
    handoffsYaml,
  ].join("\n");

  return `---\n${frontmatter}\n---\n${body.trimEnd()}\n`;
}

/** Builds a minimal SKILL.md string for a given agent name. */
function buildSkillContent(
  name: string,
  description: string,
  argumentHint: string,
  body: string,
): string {
  return [
    "---",
    `name: ${name}`,
    `description: ${description}`,
    `argument-hint: ${argumentHint}`,
    "---",
    body,
  ].join("\n");
}

/** Sets up all 4 skill files and (optionally) all 4 matching agent files. */
function setupAllSkillsAndAgents(
  workspaceRoot: string,
  includeAgentFiles: boolean,
  agentFileOverrides = new Map<string, string>(),
): void {
  for (const config of PLAN_AGENT_CONFIGS) {
    const agentFileName = config.agentFile.split("/").at(-1) ?? "";
    const name = agentFileName.replace(".agent.md", "");
    const description = `"Description for ${name}"`;
    const argumentHint = `"Hint for ${name}"`;
    const body = `\n# ${name}\n\nSkill content.\n`;

    fileContents.set(
      path.join(workspaceRoot, config.skillFile),
      buildSkillContent(name, description, argumentHint, body),
    );

    if (includeAgentFiles) {
      const override = agentFileOverrides.get(config.agentFile);
      const agentContent =
        override ??
        buildExpectedAgentContent(
          config,
          name,
          description,
          argumentHint,
          body,
        );
      fileContents.set(
        path.join(workspaceRoot, config.agentFile),
        agentContent,
      );
    }
  }
}

describe(PlanAgentsCommand, () => {
  let command: PlanAgentsCommand;
  let logger: LoggerService;

  const workspaceRoot = process.cwd();

  const createTestingModule = async (): Promise<TestingModule> => {
    return Test.createTestingModule({
      providers: [
        PlanAgentsCommand,
        SynchronizationModeService,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();
  };

  beforeAll(async () => {
    const module = await createTestingModule();
    command = await module.resolve(PlanAgentsCommand);
    logger = await module.resolve(LoggerService);
  });

  beforeEach(() => {
    fileContents.clear();
    vi.clearAllMocks();
  });

  it("is defined", () => {
    expect(command).toBeDefined();
  });

  it("sets logger context", async () => {
    const module = await createTestingModule();
    const instanceLogger = await module.resolve(LoggerService);

    expect(instanceLogger.setContext).toHaveBeenCalledWith("PlanAgentsCommand");
  });

  it.each([
    {
      modeArguments: ["check"],
      scenarioName:
        "passes check mode when all agent files match generated content",
    },
    {
      modeArguments: [],
      scenarioName: "defaults to check mode when no mode is provided",
    },
  ])("$scenarioName", async ({ modeArguments }) => {
    setupAllSkillsAndAgents(workspaceRoot, true);

    await command.run(modeArguments);

    expect(logger.log).toHaveBeenCalledWith(
      `✅ All ${PLAN_AGENT_CONFIGS.length} plan agent files are in sync`,
    );
    expect(writeFileSync).not.toHaveBeenCalled();
  });

  it("writes all agent files in write mode", async () => {
    setupAllSkillsAndAgents(workspaceRoot, false);

    await command.run(["write"]);

    expect(writeFileSync).toHaveBeenCalledTimes(PLAN_AGENT_CONFIGS.length);

    for (const config of PLAN_AGENT_CONFIGS) {
      const agentFileName = config.agentFile.split("/").at(-1) ?? "";
      const name = agentFileName.replace(".agent.md", "");

      expect(writeFileSync).toHaveBeenCalledWith(
        path.join(workspaceRoot, config.agentFile),
        expect.stringContaining(`name: ${name}`),
        "utf8",
      );
    }
  });

  it("exits with error for invalid mode", async () => {
    setupAllSkillsAndAgents(workspaceRoot, true);

    await expectProcessExitOne(async () => command.run(["invalid-mode"]));

    expect(logger.error).toHaveBeenCalledWith("❌ Unknown mode: invalid-mode");
    expect(logger.error).toHaveBeenCalledWith("Expected 'check' or 'write'");
  });

  it.each([
    {
      assertLogs: (loggerService: LoggerService): void => {
        expect(loggerService.log).toHaveBeenCalledWith(
          expect.stringContaining("❌ Agent file out of sync:"),
        );
        expect(loggerService.log).toHaveBeenCalledWith(
          expect.stringContaining("💡 Run"),
        );
      },
      scenarioName: "reports drift when an agent file has stale content",
      setup: (): void => {
        const [firstConfig] = PLAN_AGENT_CONFIGS;
        if (!firstConfig) return;

        const overrides = new Map<string, string>([
          [firstConfig.agentFile, "stale content"],
        ]);
        setupAllSkillsAndAgents(workspaceRoot, true, overrides);
      },
    },
    {
      assertLogs: (loggerService: LoggerService): void => {
        expect(loggerService.log).toHaveBeenCalledWith(
          expect.stringContaining("❌ Agent file not found:"),
        );
      },
      scenarioName: "reports missing agent file in check mode",
      setup: (): void => {
        setupAllSkillsAndAgents(workspaceRoot, false);
      },
    },
  ])("$scenarioName", async ({ assertLogs, setup }) => {
    setup();
    const processExitSpy = mockProcessExit();

    await expect(command.run(["check"])).rejects.toThrow("process.exit:1");

    assertLogs(logger);

    processExitSpy.mockRestore();
  });

  it("handles SKILL.md content without frontmatter delimiters in write mode", async () => {
    for (const config of PLAN_AGENT_CONFIGS) {
      fileContents.set(
        path.join(workspaceRoot, config.skillFile),
        "No frontmatter here — plain text only",
      );
    }

    await command.run(["write"]);

    expect(writeFileSync).toHaveBeenCalledTimes(PLAN_AGENT_CONFIGS.length);

    for (const config of PLAN_AGENT_CONFIGS) {
      expect(writeFileSync).toHaveBeenCalledWith(
        path.join(workspaceRoot, config.agentFile),
        expect.stringContaining("description: \nname: "),
        "utf8",
      );
    }
  });

  it("handles SKILL.md frontmatter with lines missing colon separator", async () => {
    for (const config of PLAN_AGENT_CONFIGS) {
      const agentFileName = config.agentFile.split("/").at(-1) ?? "";
      const name = agentFileName.replace(".agent.md", "");
      fileContents.set(
        path.join(workspaceRoot, config.skillFile),
        [
          "---",
          "no-colon-line",
          `name: ${name}`,
          `description: desc`,
          `argument-hint: hint`,
          "---",
          `body content`,
        ].join("\n"),
      );
    }

    await command.run(["write"]);

    expect(writeFileSync).toHaveBeenCalledTimes(PLAN_AGENT_CONFIGS.length);
  });

  it("preserves existing agent frontmatter fields while syncing skill metadata and body", async () => {
    const [firstConfig] = PLAN_AGENT_CONFIGS;
    if (!firstConfig) {
      return;
    }

    const skillContent = buildSkillContent(
      "change-plan",
      '"New description"',
      '"New hint"',
      "\n# New Body\n\nUpdated body content.\n",
    );

    fileContents.set(
      path.join(workspaceRoot, firstConfig.skillFile),
      skillContent,
    );

    const existingAgentContent = [
      "---",
      'argument-hint: "Old hint"',
      "agents:\n  - explore-codebase\n  - explore-internet",
      'description: "Old description"',
      "disable-model-invocation: true",
      "handoffs:",
      "  - label: Execute Plan",
      "    agent: execute-plan",
      '    prompt: "Execute the revised plan."',
      "    send: false",
      "model: Auto (copilot)",
      "name: change-plan",
      "tools:",
      "  - agent",
      "  - read",
      "  - edit",
      "  - search",
      "user-invocable: true",
      "---",
      "# Old Body",
      "",
      "Outdated body content.",
      "",
    ].join("\n");

    fileContents.set(
      path.join(workspaceRoot, firstConfig.agentFile),
      existingAgentContent,
    );

    for (const config of PLAN_AGENT_CONFIGS.slice(1)) {
      const agentFileName = config.agentFile.split("/").at(-1) ?? "";
      const name = agentFileName.replace(".agent.md", "");
      const description = `"Description for ${name}"`;
      const argumentHint = `"Hint for ${name}"`;
      const body = `\n# ${name}\n\nSkill content.\n`;

      fileContents.set(
        path.join(workspaceRoot, config.skillFile),
        buildSkillContent(name, description, argumentHint, body),
      );

      fileContents.set(
        path.join(workspaceRoot, config.agentFile),
        buildExpectedAgentContent(
          config,
          name,
          description,
          argumentHint,
          body,
        ),
      );
    }

    await command.run(["write"]);

    const writtenContent = fileContents.get(
      path.join(workspaceRoot, firstConfig.agentFile),
    );

    expect(writtenContent).toContain('argument-hint: "New hint"');
    expect(writtenContent).toContain('description: "New description"');
    expect(writtenContent).toContain("name: change-plan");
    expect(writtenContent).toContain("disable-model-invocation: true");
    expect(writtenContent).toContain("model: Auto (copilot)");
    expect(writtenContent).toContain("user-invocable: true");
    expect(writtenContent).toContain(
      "agents:\n  - explore-codebase\n  - explore-internet",
    );
    expect(writtenContent).toContain("# New Body");
    expect(writtenContent).not.toContain("# Old Body");
  });

  it("appends missing skill frontmatter fields when syncing an existing agent file", async () => {
    const [firstConfig] = PLAN_AGENT_CONFIGS;
    if (!firstConfig) {
      return;
    }

    setupAllSkillsAndAgents(workspaceRoot, true);
    fileContents.set(
      path.join(workspaceRoot, firstConfig.skillFile),
      buildSkillContent(
        "change-plan",
        '"Appended description"',
        '"Appended hint"',
        "\n# Appended Body\n\nUpdated body content.\n",
      ),
    );
    fileContents.set(
      path.join(workspaceRoot, firstConfig.agentFile),
      [
        "---",
        'description: "Existing description"',
        "name: change-plan",
        "agents:",
        "  - explore-codebase",
        "  - explore-internet",
        "infer: true",
        "model: Auto (copilot)",
        "tools:",
        "  - agent",
        "  - read",
        "handoffs:",
        "  - label: Execute Plan",
        "    agent: execute-plan",
        '    prompt: "Execute the revised plan."',
        "    send: false",
        "user-invocable: true",
        "---",
        "# Old Body",
        "",
        "Outdated body content.",
        "",
      ].join("\n"),
    );

    await command.run(["write"]);

    const writtenContent = fileContents.get(
      path.join(workspaceRoot, firstConfig.agentFile),
    );

    expect(writtenContent).toContain('description: "Appended description"');
    expect(writtenContent).toContain('argument-hint: "Appended hint"');
    expect(writtenContent).toContain("name: change-plan");
    expect(writtenContent).toContain("user-invocable: true");
    expect(writtenContent).toContain("# Appended Body");
  });

  it("handles a non-Error thrown during sync", async () => {
    vi.mocked(readFileSync).mockImplementationOnce(() => {
      // eslint-disable-next-line @typescript-eslint/only-throw-error
      throw "string error";
    });

    await expectProcessExitOne(async () => command.run(["write"]));

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("string error"),
    );
  });
});
