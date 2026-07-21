import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { createMock } from "@golevelup/ts-vitest";
import { Test, type TestingModule } from "@nestjs/testing";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { expectProcessExitOne, mockProcessExit } from "../../../testing/mocks";
import { LoggerService } from "../logger/logger.service";
import { SynchronizationModeService } from "../synchronization/synchronization-mode.service";

import { TriageAgentsCommand } from "./triage-agents.command";
import { TRIAGE_AGENT_CONFIGS } from "./triage-agents.constants";

import type { TriageAgentConfig } from "./triage-agents.types";

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
  config: TriageAgentConfig,
  name: string,
  description: string,
  argumentHint: string,
  body: string,
): string {
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

/** Sets up all skill files and (optionally) all matching agent files. */
function setupAllSkillsAndAgents(
  workspaceRoot: string,
  includeAgentFiles: boolean,
  agentFileOverrides = new Map<string, string>(),
): void {
  for (const config of TRIAGE_AGENT_CONFIGS) {
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

describe(TriageAgentsCommand, () => {
  let command: TriageAgentsCommand;
  let logger: LoggerService;

  const workspaceRoot = process.cwd();

  const createTestingModule = async (): Promise<TestingModule> => {
    return Test.createTestingModule({
      providers: [
        TriageAgentsCommand,
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
    command = await module.resolve(TriageAgentsCommand);
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

    expect(instanceLogger.setContext).toHaveBeenCalledWith(
      "TriageAgentsCommand",
    );
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
      `✅ All ${TRIAGE_AGENT_CONFIGS.length} triage agent files are in sync`,
    );
    expect(writeFileSync).not.toHaveBeenCalled();
  });

  it("writes all agent files in write mode", async () => {
    setupAllSkillsAndAgents(workspaceRoot, false);

    await command.run(["write"]);

    expect(writeFileSync).toHaveBeenCalledTimes(TRIAGE_AGENT_CONFIGS.length);

    for (const config of TRIAGE_AGENT_CONFIGS) {
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
        const [firstConfig] = TRIAGE_AGENT_CONFIGS;
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
    for (const config of TRIAGE_AGENT_CONFIGS) {
      fileContents.set(
        path.join(workspaceRoot, config.skillFile),
        "No frontmatter here — plain text only",
      );
    }

    await command.run(["write"]);

    expect(writeFileSync).toHaveBeenCalledTimes(TRIAGE_AGENT_CONFIGS.length);

    for (const config of TRIAGE_AGENT_CONFIGS) {
      expect(writeFileSync).toHaveBeenCalledWith(
        path.join(workspaceRoot, config.agentFile),
        expect.stringContaining("description: \nname: "),
        "utf8",
      );
    }
  });

  it("handles SKILL.md frontmatter with lines missing colon separator", async () => {
    for (const config of TRIAGE_AGENT_CONFIGS) {
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

    expect(writeFileSync).toHaveBeenCalledTimes(TRIAGE_AGENT_CONFIGS.length);
  });

  it("preserves existing non-skill frontmatter while syncing skill metadata and body", async () => {
    const [firstConfig] = TRIAGE_AGENT_CONFIGS;
    if (!firstConfig) {
      return;
    }

    setupAllSkillsAndAgents(workspaceRoot, true);

    const skillBody = "\n# updated\n\nUpdated skill body.\n";
    fileContents.set(
      path.join(workspaceRoot, firstConfig.skillFile),
      buildSkillContent(
        "updated-name",
        '"Updated description"',
        '"Updated hint"',
        skillBody,
      ),
    );

    fileContents.set(
      path.join(workspaceRoot, firstConfig.agentFile),
      [
        "---",
        'description: "Existing description"',
        "name: existing-name",
        'argument-hint: "Existing hint"',
        "disable-model-invocation: true",
        "user-invocable: true",
        "model: Auto (copilot)",
        "tools:",
        "  - read",
        "  - execute",
        "handoffs:",
        "  - label: Existing handoff",
        "    agent: triage-submission",
        '    prompt: "Existing prompt"',
        "    send: false",
        "---",
        "# existing-body",
        "",
        "Old body that should be replaced.",
        "",
      ].join("\n"),
    );

    await command.run(["write"]);

    const syncedContent = fileContents.get(
      path.join(workspaceRoot, firstConfig.agentFile),
    );

    expect(syncedContent).toContain("name: updated-name");
    expect(syncedContent).toContain('description: "Updated description"');
    expect(syncedContent).toContain('argument-hint: "Updated hint"');
    expect(syncedContent).toContain("disable-model-invocation: true");
    expect(syncedContent).toContain("user-invocable: true");
    expect(syncedContent).toContain("model: Auto (copilot)");
    expect(syncedContent).toContain("# updated");
    expect(syncedContent).not.toContain("# existing-body");
  });

  it("appends missing skill frontmatter fields for an existing triage agent file", async () => {
    const [firstConfig] = TRIAGE_AGENT_CONFIGS;
    if (!firstConfig) {
      return;
    }

    setupAllSkillsAndAgents(workspaceRoot, true);
    fileContents.set(
      path.join(workspaceRoot, firstConfig.skillFile),
      buildSkillContent(
        "triage-deployment",
        '"Updated description"',
        '"Updated hint"',
        "\n# updated\n\nUpdated skill body.\n",
      ),
    );
    fileContents.set(
      path.join(workspaceRoot, firstConfig.agentFile),
      [
        "---",
        'description: "Existing description"',
        "name: triage-deployment",
        "infer: true",
        "model: Auto (copilot)",
        "tools:",
        "  - read",
        "  - execute",
        "handoffs:",
        "  - label: Existing handoff",
        "    agent: triage-submission",
        '    prompt: "Existing prompt"',
        "    send: false",
        "user-invocable: true",
        "---",
        "# existing-body",
        "",
        "Old body that should be replaced.",
        "",
      ].join("\n"),
    );

    await command.run(["write"]);

    const syncedContent = fileContents.get(
      path.join(workspaceRoot, firstConfig.agentFile),
    );

    expect(syncedContent).toContain('description: "Updated description"');
    expect(syncedContent).toContain('argument-hint: "Updated hint"');
    expect(syncedContent).toContain("name: triage-deployment");
    expect(syncedContent).toContain("user-invocable: true");
    expect(syncedContent).toContain("# updated");
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
