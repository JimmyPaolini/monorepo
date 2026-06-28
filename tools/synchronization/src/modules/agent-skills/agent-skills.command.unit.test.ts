import { readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LoggerService } from "../logger/logger.service";

import { AgentSkillsCommand } from "./agent-skills.command";

const fileContents = new Map<string, string>();
const directoryEntries = new Map<
  string,
  { isDirectory: () => boolean; name: string }[]
>();

vi.mock("node:fs", () => {
  return {
    readdirSync: vi.fn((directoryPath: string) => {
      return directoryEntries.get(directoryPath) ?? [];
    }),
    readFileSync: vi.fn((filePath: string): string => {
      const value = fileContents.get(filePath);
      if (value === undefined) {
        throw new Error(`File not found: ${filePath}`);
      }
      return value;
    }),
    writeFileSync: vi.fn((filePath: string, content: string): void => {
      fileContents.set(filePath, content);
    }),
  };
});

describe(AgentSkillsCommand, () => {
  let command: AgentSkillsCommand;
  let logger: LoggerService;

  const workspaceRoot = process.cwd();
  const agentsFile = path.join(workspaceRoot, "AGENTS.md");
  const skillsDirectory = path.join(workspaceRoot, "documentation/skills");

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AgentSkillsCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

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
    const module = await Test.createTestingModule({
      providers: [
        AgentSkillsCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    const logger = await module.resolve(LoggerService);

    expect(logger.setContext).toHaveBeenCalledWith("AgentSkillsCommand");
  });

  it("passes check mode when generated content matches AGENTS markers", async () => {
    fileContents.set(
      agentsFile,
      [
        "# Header",
        "<!-- agent-skills-table-of-contents start -->",
        "- **[alpha](documentation/skills/alpha/SKILL.md)**: first skill",
        "- **[beta](documentation/skills/beta/SKILL.md)**: second skill",
        "<!-- agent-skills-table-of-contents end -->",
      ].join("\n"),
    );
    directoryEntries.set(skillsDirectory, [
      { isDirectory: () => true, name: "beta" },
      { isDirectory: () => true, name: "alpha" },
    ]);
    fileContents.set(
      path.join(skillsDirectory, "alpha", "SKILL.md"),
      ["---", "name: alpha", "description: first skill", "---"].join("\n"),
    );
    fileContents.set(
      path.join(skillsDirectory, "beta", "SKILL.md"),
      ["---", "name: beta", "description: second skill", "---"].join("\n"),
    );

    await command.run(["check"]);

    expect(logger.log).toHaveBeenCalledWith(
      "✅ Skills table of contents is in sync (2 skills)",
    );
    expect(writeFileSync).not.toHaveBeenCalled();
  });

  it("defaults to check mode when no mode is provided", async () => {
    fileContents.set(
      agentsFile,
      [
        "# Header",
        "<!-- agent-skills-table-of-contents start -->",
        "- **[alpha](documentation/skills/alpha/SKILL.md)**: first skill",
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

    await command.run([]);

    expect(logger.log).toHaveBeenCalledWith(
      "✅ Skills table of contents is in sync (1 skills)",
    );
  });

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

    const processExitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: null | number | string) => {
        throw new Error(`process.exit:${code ?? 0}`);
      });

    await expect(command.run(["invalid-mode"])).rejects.toThrow(
      "process.exit:1",
    );

    expect(logger.error).toHaveBeenCalledWith("❌ Unknown mode: invalid-mode");
    expect(logger.error).toHaveBeenCalledWith("Expected 'check' or 'write'");

    processExitSpy.mockRestore();
  });

  it("exits with error when required markers are missing", async () => {
    fileContents.set(agentsFile, "# Header without markers");
    directoryEntries.set(skillsDirectory, []);

    const processExitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: null | number | string) => {
        throw new Error(`process.exit:${code ?? 0}`);
      });

    await expect(command.run(["check"])).rejects.toThrow("process.exit:1");

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("Markers not found in AGENTS.md"),
    );

    processExitSpy.mockRestore();
  });

  it("reports drift when generated skills differ and skips invalid skill entries", async () => {
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
    ]);
    fileContents.set(
      path.join(skillsDirectory, "alpha", "SKILL.md"),
      ["---", "name: alpha", "description: first skill", "---"].join("\n"),
    );
    fileContents.set(
      path.join(skillsDirectory, "empty", "SKILL.md"),
      ["---", "name: empty", "invalid-line", "---"].join("\n"),
    );

    const processExitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: null | number | string) => {
        throw new Error(`process.exit:${code ?? 0}`);
      });

    await expect(command.run(["check"])).rejects.toThrow("process.exit:1");

    expect(logger.log).toHaveBeenCalledWith(
      "❌ Skills table of contents in AGENTS.md is out of sync\n",
    );
    expect(logger.log).toHaveBeenCalledWith(
      "💡 Run 'pnpm exec nx run synchronization:agent-skills:write' to sync\n",
    );

    processExitSpy.mockRestore();
  });

  it("handles non-Error throw values in run catch block", async () => {
    const nonErrorLike: Error = {
      message: "boom",
      name: "NonErrorLike",
    };

    vi.mocked(readdirSync).mockImplementationOnce(() => {
      throw nonErrorLike;
    });

    const processExitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: null | number | string) => {
        throw new Error(`process.exit:${code ?? 0}`);
      });

    await expect(command.run(["check"])).rejects.toThrow("process.exit:1");

    expect(logger.error).toHaveBeenCalledWith("❌ Error: [object Object]");

    processExitSpy.mockRestore();
  });
});
