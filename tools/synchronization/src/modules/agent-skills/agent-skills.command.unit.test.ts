import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { createMock } from "@golevelup/ts-vitest";
import { Test, type TestingModule } from "@nestjs/testing";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { expectProcessExitOne } from "../../../testing/mocks";
import { LoggerService } from "../logger/logger.service";
import { SynchronizationModeService } from "../synchronization/synchronization-mode.service";

import {
  generateAgentFile,
  readAgentsSection,
  readCustomAgentsMetadata,
  readSkillSourceFile,
  readSkillTableMetadata,
  renderCustomAgentsTable,
  renderSkillTable,
} from "./agent-skills-sync.utilities";
import { AgentSkillsCommand } from "./agent-skills.command";
import {
  AGENT_SKILLS_TOC_END,
  AGENT_SKILLS_TOC_START,
  CUSTOM_AGENTS_TOC_END,
  CUSTOM_AGENTS_TOC_START,
} from "./agent-skills.constants";

import type {
  AgentSkillMetadata,
  CustomAgentMetadata,
  SkillSourceMetadata,
} from "./agent-skills.types";

vi.mock("node:fs", () => ({
  readFileSync: vi.fn<(filePath: string) => string>(),
  writeFileSync: vi.fn<(filePath: string, content: string) => void>(),
}));

vi.mock("./agent-skills-sync.utilities", () => ({
  generateAgentFile:
    vi.fn<
      (skill: SkillSourceMetadata, existingAgentContent?: string) => string
    >(),
  readAgentsSection: vi.fn<
    (
      workspaceRoot: string,
      startMarker: string,
      endMarker: string,
    ) => {
      afterMarker: string;
      beforeMarker: string;
      generatedContent: string;
    }
  >(),
  readCustomAgentsMetadata:
    vi.fn<(workspaceRoot: string) => CustomAgentMetadata[]>(),
  readSkillSourceFile: vi.fn<(skillPath: string) => SkillSourceMetadata>(),
  readSkillTableMetadata:
    vi.fn<(workspaceRoot: string) => AgentSkillMetadata[]>(),
  renderCustomAgentsTable: vi.fn<(agents: CustomAgentMetadata[]) => string>(),
  renderSkillTable: vi.fn<(skills: AgentSkillMetadata[]) => string>(),
}));

describe(AgentSkillsCommand, () => {
  let command: AgentSkillsCommand;
  let logger: LoggerService;

  const createTestingModule = async (): Promise<TestingModule> => {
    return Test.createTestingModule({
      providers: [
        AgentSkillsCommand,
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
    command = await module.resolve(AgentSkillsCommand);
    logger = await module.resolve(LoggerService);
  });

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(readSkillSourceFile).mockReturnValue({
      argumentHint: '"hint"',
      body: "# Body",
      description: '"description"',
      name: "question-me",
    });
    vi.mocked(generateAgentFile).mockReturnValue("generated-content\n");
    vi.mocked(readCustomAgentsMetadata).mockReturnValue([
      {
        description: "Question helper",
        fileName: "question-me.agent.md",
        name: "question-me",
      },
    ]);
    vi.mocked(renderCustomAgentsTable).mockReturnValue(
      "- **[question-me](.github/agents/question-me.agent.md)**: Question helper",
    );
    vi.mocked(readSkillTableMetadata).mockReturnValue([
      {
        description: "Question helper",
        filePath: "documentation/skills/question-me/SKILL.md",
        name: "question-me",
      },
    ]);
    vi.mocked(renderSkillTable).mockReturnValue(
      "- **[question-me](documentation/skills/question-me/SKILL.md)**: Question helper",
    );
    vi.mocked(readAgentsSection).mockImplementation(
      (_workspaceRoot: string, startMarker: string) => {
        if (startMarker === CUSTOM_AGENTS_TOC_START) {
          return {
            afterMarker: `${CUSTOM_AGENTS_TOC_END}\nfooter`,
            beforeMarker: `header\n${CUSTOM_AGENTS_TOC_START}`,
            generatedContent:
              "\n- **[question-me](.github/agents/question-me.agent.md)**: Question helper\n",
          };
        }

        if (startMarker === AGENT_SKILLS_TOC_START) {
          return {
            afterMarker: `${AGENT_SKILLS_TOC_END}\nfooter`,
            beforeMarker: `header\n${AGENT_SKILLS_TOC_START}`,
            generatedContent:
              "\n- **[question-me](documentation/skills/question-me/SKILL.md)**: Question helper\n",
          };
        }

        return {
          afterMarker: "",
          beforeMarker: "",
          generatedContent: "",
        };
      },
    );
    vi.mocked(readFileSync).mockImplementation((filePath: unknown) => {
      if (typeof filePath !== "string") {
        throw new TypeError("Unexpected non-string read path");
      }

      if (filePath.endsWith(".agent.md")) {
        return "generated-content\n";
      }

      throw new Error(`Unexpected read path: ${filePath}`);
    });
  });

  it("is defined", () => {
    expect(command).toBeDefined();
  });

  it("sets logger context", async () => {
    const module = await createTestingModule();
    const instanceLogger = await module.resolve(LoggerService);

    expect(instanceLogger.setContext).toHaveBeenCalledWith(
      "AgentSkillsCommand",
    );
  });

  it("exits with error for invalid mode", async () => {
    await expectProcessExitOne(async () => command.run(["invalid-mode"]));

    expect(logger.error).toHaveBeenCalledWith("❌ Unknown mode: invalid-mode");
    expect(logger.error).toHaveBeenCalledWith("Expected 'check' or 'write'");
  });

  it("runs check mode when all synchronized files are in sync", async () => {
    await command.run(["check"]);

    expect(logger.log).toHaveBeenCalledWith(
      "✅ question-me agent file is in sync",
    );
    expect(logger.log).toHaveBeenCalledWith(
      "✅ All 6 plan agent files are in sync",
    );
    expect(logger.log).toHaveBeenCalledWith(
      "✅ All 2 triage agent files are in sync",
    );
    expect(logger.log).toHaveBeenCalledWith(
      "✅ Custom agents table of contents is in sync (1 agent)",
    );
    expect(logger.log).toHaveBeenCalledWith(
      "✅ Skills table of contents is in sync (1 skills)",
    );
  });

  it("exits in check mode when an agent file is out of sync", async () => {
    vi.mocked(readFileSync).mockImplementation((filePath: unknown) => {
      if (typeof filePath !== "string") {
        throw new TypeError("Unexpected non-string read path");
      }

      if (filePath.endsWith("question-me.agent.md")) {
        return "actual-content\n";
      }

      return "generated-content\n";
    });

    await expectProcessExitOne(async () => command.run(["check"]));

    expect(logger.log).toHaveBeenCalledWith(
      "❌ Agent file out of sync: .github/agents/question-me.agent.md",
    );
  });

  it("exits in check mode when a plan agent file is out of sync", async () => {
    vi.mocked(readFileSync).mockImplementation((filePath: unknown) => {
      if (typeof filePath !== "string") {
        throw new TypeError("Unexpected non-string read path");
      }

      if (filePath.endsWith("change-plan.agent.md")) {
        return "actual-content\n";
      }

      return "generated-content\n";
    });

    await expectProcessExitOne(async () => command.run(["check"]));

    expect(logger.log).toHaveBeenCalledWith(
      "❌ Agent file out of sync: .github/agents/change-plan.agent.md",
    );
  });

  it("exits in check mode when a triage agent file is out of sync", async () => {
    vi.mocked(readFileSync).mockImplementation((filePath: unknown) => {
      if (typeof filePath !== "string") {
        throw new TypeError("Unexpected non-string read path");
      }

      if (filePath.endsWith("triage-deployment.agent.md")) {
        return "actual-content\n";
      }

      return "generated-content\n";
    });

    await expectProcessExitOne(async () => command.run(["check"]));

    expect(logger.log).toHaveBeenCalledWith(
      "❌ Agent file out of sync: .github/agents/triage-deployment.agent.md",
    );
  });

  it("exits in check mode when custom agents table is out of sync", async () => {
    vi.mocked(readAgentsSection).mockImplementation(
      (_workspaceRoot: string, startMarker: string) => {
        if (startMarker === CUSTOM_AGENTS_TOC_START) {
          return {
            afterMarker: `${CUSTOM_AGENTS_TOC_END}\nfooter`,
            beforeMarker: `header\n${CUSTOM_AGENTS_TOC_START}`,
            generatedContent: "out-of-sync-content",
          };
        }

        return {
          afterMarker: `${AGENT_SKILLS_TOC_END}\nfooter`,
          beforeMarker: `header\n${AGENT_SKILLS_TOC_START}`,
          generatedContent:
            "\n- **[question-me](documentation/skills/question-me/SKILL.md)**: Question helper\n",
        };
      },
    );

    await expectProcessExitOne(async () => command.run(["check"]));

    expect(logger.log).toHaveBeenCalledWith(
      "❌ Custom agents table of contents in AGENTS.md is out of sync\n",
    );
  });

  it("exits in check mode when skills table is out of sync", async () => {
    vi.mocked(readAgentsSection).mockImplementation(
      (_workspaceRoot: string, startMarker: string) => {
        if (startMarker === CUSTOM_AGENTS_TOC_START) {
          return {
            afterMarker: `${CUSTOM_AGENTS_TOC_END}\nfooter`,
            beforeMarker: `header\n${CUSTOM_AGENTS_TOC_START}`,
            generatedContent:
              "\n- **[question-me](.github/agents/question-me.agent.md)**: Question helper\n",
          };
        }

        return {
          afterMarker: `${AGENT_SKILLS_TOC_END}\nfooter`,
          beforeMarker: `header\n${AGENT_SKILLS_TOC_START}`,
          generatedContent: "out-of-sync-content",
        };
      },
    );

    await expectProcessExitOne(async () => command.run(["check"]));

    expect(logger.log).toHaveBeenCalledWith(
      "❌ Skills table of contents in AGENTS.md is out of sync\n",
    );
  });

  it("runs write mode and updates agent and AGENTS files", async () => {
    vi.mocked(readCustomAgentsMetadata).mockReturnValue([
      {
        description: "Question helper",
        fileName: "question-me.agent.md",
        name: "question-me",
      },
      {
        description: "Plan helper",
        fileName: "create-plan.agent.md",
        name: "create-plan",
      },
    ]);

    vi.mocked(readFileSync).mockImplementation(() => {
      throw new Error("missing existing file");
    });

    await command.run(["write"]);

    expect(writeFileSync).toHaveBeenCalledTimes(11);
    expect(writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining(
        path.join(".github", "agents", "question-me.agent.md"),
      ),
      "generated-content\n",
      "utf8",
    );
    expect(logger.log).toHaveBeenCalledWith("✅ Updated question-me.agent.md");
    expect(logger.log).toHaveBeenCalledWith(
      "✅ Updated AGENTS.md with 2 agents",
    );
    expect(logger.log).toHaveBeenCalledWith(
      "✅ Updated AGENTS.md with 1 skills",
    );
  });

  it("handles runtime errors by logging and exiting", async () => {
    vi.mocked(readSkillSourceFile).mockImplementation(() => {
      throw new Error("cannot read skill");
    });

    await expectProcessExitOne(async () => command.run(["write"]));

    expect(logger.error).toHaveBeenCalledWith("❌ Error: cannot read skill");
  });
});
