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

import { CustomAgentsCommand } from "./custom-agents.command";
import { AGENTS_DIRECTORY } from "./custom-agents.constants";

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

describe(CustomAgentsCommand, () => {
  let command: CustomAgentsCommand;
  let logger: LoggerService;

  const workspaceRoot = process.cwd();
  const agentsMdPath = path.join(workspaceRoot, "AGENTS.md");
  const agentsDirectory = path.join(workspaceRoot, AGENTS_DIRECTORY);

  const createTestingModule = async (): Promise<TestingModule> => {
    return Test.createTestingModule({
      providers: [
        CustomAgentsCommand,
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
    command = await module.resolve(CustomAgentsCommand);
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
    const instanceLogger = await module.resolve(LoggerService);

    expect(instanceLogger.setContext).toHaveBeenCalledWith(
      "CustomAgentsCommand",
    );
  });

  it.each([
    {
      agentFiles: [
        {
          description: "first agent",
          fileName: "alpha.agent.md",
          name: "alpha",
        },
        {
          description: "second agent",
          fileName: "beta.agent.md",
          name: "beta",
        },
      ],
      agentsMdContent: [
        "# Header",
        "<!-- custom-agents-table-of-contents start -->",
        "- **[alpha](.github/agents/alpha.agent.md)**: first agent",
        "- **[beta](.github/agents/beta.agent.md)**: second agent",
        "<!-- custom-agents-table-of-contents end -->",
      ].join("\n"),
      expectedLogMessage:
        "✅ Custom agents table of contents is in sync (2 agents)",
      modeArguments: ["check"],
      scenarioName: "passes check mode when generated content matches markers",
    },
    {
      agentFiles: [
        {
          description: "first agent",
          fileName: "alpha.agent.md",
          name: "alpha",
        },
      ],
      agentsMdContent: [
        "# Header",
        "<!-- custom-agents-table-of-contents start -->",
        "- **[alpha](.github/agents/alpha.agent.md)**: first agent",
        "<!-- custom-agents-table-of-contents end -->",
      ].join("\n"),
      expectedLogMessage:
        "✅ Custom agents table of contents is in sync (1 agent)",
      modeArguments: [],
      scenarioName: "defaults to check mode when no mode is provided",
    },
  ])(
    "$scenarioName",
    async ({
      agentFiles,
      agentsMdContent,
      expectedLogMessage,
      modeArguments,
    }) => {
      fileContents.set(agentsMdPath, agentsMdContent);
      directoryEntries.set(
        agentsDirectory,
        agentFiles.map((agent) => ({
          isDirectory: () => false,
          name: agent.fileName,
        })),
      );

      for (const agent of agentFiles) {
        fileContents.set(
          path.join(agentsDirectory, agent.fileName),
          [
            "---",
            `name: ${agent.name}`,
            `description: ${agent.description}`,
            "---",
            "",
          ].join("\n"),
        );
      }

      await command.run(modeArguments);

      expect(logger.log).toHaveBeenCalledWith(expectedLogMessage);
      expect(writeFileSync).not.toHaveBeenCalled();
    },
  );

  it("uses filename stem as name fallback when frontmatter has no name field", async () => {
    fileContents.set(
      agentsMdPath,
      [
        "# Header",
        "<!-- custom-agents-table-of-contents start -->",
        "- **[my-agent](.github/agents/my-agent.agent.md)**: some description",
        "<!-- custom-agents-table-of-contents end -->",
      ].join("\n"),
    );
    directoryEntries.set(agentsDirectory, [
      { isDirectory: () => false, name: "my-agent.agent.md" },
    ]);
    fileContents.set(
      path.join(agentsDirectory, "my-agent.agent.md"),
      ["---", "description: some description", "---", ""].join("\n"),
    );

    await command.run(["check"]);

    expect(logger.log).toHaveBeenCalledWith(
      "✅ Custom agents table of contents is in sync (1 agent)",
    );
  });

  it("strips surrounding quotes from name and description frontmatter values", async () => {
    fileContents.set(
      agentsMdPath,
      [
        "# Header",
        "<!-- custom-agents-table-of-contents start -->",
        "- **[My Agent](.github/agents/my-agent.agent.md)**: My quoted description",
        "<!-- custom-agents-table-of-contents end -->",
      ].join("\n"),
    );
    directoryEntries.set(agentsDirectory, [
      { isDirectory: () => false, name: "my-agent.agent.md" },
    ]);
    fileContents.set(
      path.join(agentsDirectory, "my-agent.agent.md"),
      [
        "---",
        'name: "My Agent"',
        'description: "My quoted description"',
        "---",
        "",
      ].join("\n"),
    );

    await command.run(["check"]);

    expect(logger.log).toHaveBeenCalledWith(
      "✅ Custom agents table of contents is in sync (1 agent)",
    );
  });

  it("skips unreadable agent files and ignores malformed frontmatter lines", async () => {
    fileContents.set(
      agentsMdPath,
      [
        "# Header",
        "<!-- custom-agents-table-of-contents start -->",
        "- **[alpha](.github/agents/alpha.agent.md)**: first agent",
        "<!-- custom-agents-table-of-contents end -->",
      ].join("\n"),
    );
    directoryEntries.set(agentsDirectory, [
      { isDirectory: () => false, name: "broken.agent.md" },
      { isDirectory: () => false, name: "alpha.agent.md" },
    ]);
    fileContents.set(
      path.join(agentsDirectory, "alpha.agent.md"),
      [
        "---",
        "name: alpha",
        "invalid-frontmatter-line",
        "description: first agent",
        "---",
        "",
      ].join("\n"),
    );

    await command.run(["check"]);

    expect(logger.log).toHaveBeenCalledWith(
      "✅ Custom agents table of contents is in sync (1 agent)",
    );
  });

  it("writes generated content to AGENTS.md in write mode", async () => {
    fileContents.set(
      agentsMdPath,
      [
        "# Header",
        "<!-- custom-agents-table-of-contents start -->",
        "- stale",
        "<!-- custom-agents-table-of-contents end -->",
      ].join("\n"),
    );
    directoryEntries.set(agentsDirectory, [
      { isDirectory: () => false, name: "alpha.agent.md" },
    ]);
    fileContents.set(
      path.join(agentsDirectory, "alpha.agent.md"),
      ["---", "name: alpha", "description: first agent", "---", ""].join("\n"),
    );

    await command.run(["write"]);

    expect(writeFileSync).toHaveBeenCalledTimes(1);
    expect(writeFileSync).toHaveBeenCalledWith(
      agentsMdPath,
      expect.stringContaining(
        "- **[alpha](.github/agents/alpha.agent.md)**: first agent",
      ),
      "utf8",
    );
    expect(logger.log).toHaveBeenCalledWith(
      "✅ Updated AGENTS.md with 1 agent",
    );
  });

  it("skips directories and non-.agent.md files in agents directory", async () => {
    fileContents.set(
      agentsMdPath,
      [
        "# Header",
        "<!-- custom-agents-table-of-contents start -->",
        "- **[alpha](.github/agents/alpha.agent.md)**: first agent",
        "<!-- custom-agents-table-of-contents end -->",
      ].join("\n"),
    );
    directoryEntries.set(agentsDirectory, [
      { isDirectory: () => true, name: "subdir" },
      { isDirectory: () => false, name: "README.md" },
      { isDirectory: () => false, name: "alpha.agent.md" },
    ]);
    fileContents.set(
      path.join(agentsDirectory, "alpha.agent.md"),
      ["---", "name: alpha", "description: first agent", "---", ""].join("\n"),
    );

    await command.run(["check"]);

    expect(logger.log).toHaveBeenCalledWith(
      "✅ Custom agents table of contents is in sync (1 agent)",
    );
  });

  it("exits with error for invalid mode", async () => {
    fileContents.set(
      agentsMdPath,
      [
        "# Header",
        "<!-- custom-agents-table-of-contents start -->",
        "",
        "<!-- custom-agents-table-of-contents end -->",
      ].join("\n"),
    );
    directoryEntries.set(agentsDirectory, []);

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
        fileContents.set(agentsMdPath, "# Header without markers");
        directoryEntries.set(agentsDirectory, []);
      },
    },
    {
      assertLogs: (loggerService: LoggerService): void => {
        expect(loggerService.log).toHaveBeenCalledWith(
          "❌ Custom agents table of contents in AGENTS.md is out of sync\n",
        );
        expect(loggerService.log).toHaveBeenCalledWith(
          "💡 Run 'pnpm exec nx run synchronization:custom-agents:write' to sync\n",
        );
      },
      modeArguments: ["check"],
      scenarioName:
        "reports drift when generated agents differ from stored content",
      setup: (): void => {
        fileContents.set(
          agentsMdPath,
          [
            "# Header",
            "<!-- custom-agents-table-of-contents start -->",
            "- stale",
            "<!-- custom-agents-table-of-contents end -->",
          ].join("\n"),
        );
        directoryEntries.set(agentsDirectory, [
          { isDirectory: () => false, name: "alpha.agent.md" },
        ]);
        fileContents.set(
          path.join(agentsDirectory, "alpha.agent.md"),
          ["---", "name: alpha", "description: first agent", "---", ""].join(
            "\n",
          ),
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
