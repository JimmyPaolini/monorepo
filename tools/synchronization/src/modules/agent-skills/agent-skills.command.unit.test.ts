import { readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { createMock } from "@golevelup/ts-vitest";
import { Test, type TestingModule } from "@nestjs/testing";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  type DirectoryEntry,
  expectProcessExitOne,
  mockProcessExit,
} from "../../../testing/mocks";
import { LoggerService } from "../logger/logger.service";
import { SynchronizationModeService } from "../synchronization/synchronization-mode.service";

import { AgentSkillsCommand } from "./agent-skills.command";

const fileContents = new Map<string, string>();
const directoryEntries = new Map<string, DirectoryEntry[]>();

vi.mock("node:fs", () => {
  return {
    readdirSync: vi.fn<(directoryPath: string) => DirectoryEntry[]>(
      (directoryPath: string) => {
        return directoryEntries.get(directoryPath) ?? [];
      },
    ),
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

describe(AgentSkillsCommand, () => {
  let command: AgentSkillsCommand;
  let logger: LoggerService;

  const workspaceRoot = process.cwd();
  const agentsFile = path.join(workspaceRoot, "AGENTS.md");
  const skillsDirectory = path.join(workspaceRoot, "documentation/skills");

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
    fileContents.clear();
    directoryEntries.clear();
    vi.clearAllMocks();
  });

  it("is defined", () => {
    expect(command).toBeDefined();
  });

  it("sets logger context", async () => {
    const module = await createTestingModule();
    const logger = await module.resolve(LoggerService);

    expect(logger.setContext).toHaveBeenCalledWith("AgentSkillsCommand");
  });

  it.each([
    {
      agentsContent: [
        "# Header",
        "<!-- agent-skills-table-of-contents start -->",
        "- **[alpha](documentation/skills/alpha/SKILL.md)**: first skill",
        "- **[beta](documentation/skills/beta/SKILL.md)**: second skill",
        "<!-- agent-skills-table-of-contents end -->",
      ].join("\n"),
      expectedLogMessage: "✅ Skills table of contents is in sync (2 skills)",
      modeArguments: ["check"],
      scenarioName:
        "passes check mode when generated content matches AGENTS markers",
      skills: [
        {
          description: "first skill",
          folderName: "alpha",
          listingEntryName: "beta",
          name: "alpha",
        },
        {
          description: "second skill",
          folderName: "beta",
          listingEntryName: "alpha",
          name: "beta",
        },
      ],
    },
    {
      agentsContent: [
        "# Header",
        "<!-- agent-skills-table-of-contents start -->",
        "- **[alpha](documentation/skills/alpha/SKILL.md)**: first skill",
        "<!-- agent-skills-table-of-contents end -->",
      ].join("\n"),
      expectedLogMessage: "✅ Skills table of contents is in sync (1 skills)",
      modeArguments: [],
      scenarioName: "defaults to check mode when no mode is provided",
      skills: [
        {
          description: "first skill",
          folderName: "alpha",
          listingEntryName: "alpha",
          name: "alpha",
        },
      ],
    },
  ])(
    "$scenarioName",
    async ({ agentsContent, expectedLogMessage, modeArguments, skills }) => {
      fileContents.set(agentsFile, agentsContent);
      directoryEntries.set(
        skillsDirectory,
        skills.map((skill) => {
          return { isDirectory: () => true, name: skill.listingEntryName };
        }),
      );

      for (const skill of skills) {
        fileContents.set(
          path.join(skillsDirectory, skill.folderName, "SKILL.md"),
          [
            "---",
            `name: ${skill.name}`,
            `description: ${skill.description}`,
            "---",
          ].join("\n"),
        );
      }

      await command.run(modeArguments);

      expect(logger.log).toHaveBeenCalledWith(expectedLogMessage);
      expect(writeFileSync).not.toHaveBeenCalled();
    },
  );

  it("writes generated content to AGENTS in write mode", async () => {
    fileContents.set(
      agentsFile,
      [
        "# Header",
        "<!-- agent-skills-table-of-contents start -->",
        "- stale",
        "<!-- agent-skills-table-of-contents end -->",
      ].join("\n"),
    );
    directoryEntries.set(skillsDirectory, [
      { isDirectory: () => true, name: "alpha" },
    ]);
    fileContents.set(
      path.join(skillsDirectory, "alpha", "SKILL.md"),
      ["---", "name: alpha", "description: first skill", "---"].join("\n"),
    );

    await command.run(["write"]);

    expect(writeFileSync).toHaveBeenCalledTimes(1);
    expect(writeFileSync).toHaveBeenCalledWith(
      agentsFile,
      expect.stringContaining(
        "- **[alpha](documentation/skills/alpha/SKILL.md)**: first skill",
      ),
      "utf8",
    );
    expect(logger.log).toHaveBeenCalledWith(
      "✅ Updated AGENTS.md with 1 skills",
    );
  });

  it("exits with error for invalid mode", async () => {
    fileContents.set(
      agentsFile,
      [
        "# Header",
        "<!-- agent-skills-table-of-contents start -->",
        "",
        "<!-- agent-skills-table-of-contents end -->",
      ].join("\n"),
    );
    directoryEntries.set(skillsDirectory, []);

    await expectProcessExitOne(async () => command.run(["invalid-mode"]));

    expect(logger.error).toHaveBeenCalledWith("❌ Unknown mode: invalid-mode");
    expect(logger.error).toHaveBeenCalledWith("Expected 'check' or 'write'");
  });

  it.each([
    {
      assertLogs: (loggerService: LoggerService): void => {
        expect(loggerService.error).toHaveBeenCalledWith(
          expect.stringContaining("Markers not found in AGENTS.md"),
        );
      },
      modeArguments: ["check"],
      scenarioName: "exits with error when required markers are missing",
      setup: (): void => {
        fileContents.set(agentsFile, "# Header without markers");
        directoryEntries.set(skillsDirectory, []);
      },
    },
    {
      assertLogs: (loggerService: LoggerService): void => {
        expect(loggerService.log).toHaveBeenCalledWith(
          "❌ Skills table of contents in AGENTS.md is out of sync\n",
        );
        expect(loggerService.log).toHaveBeenCalledWith(
          "💡 Run 'pnpm exec nx run synchronization:agent-skills:write' to sync\n",
        );
      },
      modeArguments: ["check"],
      scenarioName:
        "reports drift when generated skills differ and skips invalid skill entries",
      setup: (): void => {
        fileContents.set(
          agentsFile,
          [
            "# Header",
            "<!-- agent-skills-table-of-contents start -->",
            "- stale",
            "<!-- agent-skills-table-of-contents end -->",
          ].join("\n"),
        );
        directoryEntries.set(skillsDirectory, [
          { isDirectory: () => false, name: "README.md" },
          { isDirectory: () => true, name: "alpha" },
          { isDirectory: () => true, name: "broken" },
          { isDirectory: () => true, name: "empty" },
          { isDirectory: () => true, name: "plain-skill" },
        ]);
        fileContents.set(
          path.join(skillsDirectory, "alpha", "SKILL.md"),
          ["---", "name: alpha", "description: first skill", "---"].join("\n"),
        );
        fileContents.set(
          path.join(skillsDirectory, "empty", "SKILL.md"),
          ["---", "name: empty", "invalid-line", "---"].join("\n"),
        );
        fileContents.set(
          path.join(skillsDirectory, "plain-skill", "SKILL.md"),
          "plain content without frontmatter",
        );
      },
    },
    {
      assertLogs: (loggerService: LoggerService): void => {
        expect(loggerService.error).toHaveBeenCalledWith(
          "❌ Error: [object Object]",
        );
      },
      modeArguments: ["check"],
      scenarioName: "handles non-Error throw values in run catch block",
      setup: (): void => {
        const nonErrorLike: Error = {
          message: "boom",
          name: "NonErrorLike",
        };

        vi.mocked(readdirSync).mockImplementationOnce(() => {
          throw nonErrorLike;
        });
      },
    },
  ])("$scenarioName", async ({ assertLogs, modeArguments, setup }) => {
    setup();
    const processExitSpy = mockProcessExit();

    await expect(command.run(modeArguments)).rejects.toThrow("process.exit:1");

    assertLogs(logger);

    processExitSpy.mockRestore();
  });
});
