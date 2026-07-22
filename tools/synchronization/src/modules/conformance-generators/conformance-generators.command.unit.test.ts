import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { createMock } from "@golevelup/ts-vitest";
import { Test, type TestingModule } from "@nestjs/testing";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { expectProcessExitOne, mockProcessExit } from "../../../testing/mocks";
import { LoggerService } from "../logger/logger.service";
import { SynchronizationModeService } from "../synchronization/synchronization-mode.service";

import { ConformanceGeneratorsCommand } from "./conformance-generators.command";

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

describe(ConformanceGeneratorsCommand, () => {
  let command: ConformanceGeneratorsCommand;
  let logger: LoggerService;

  const workspaceRoot = process.cwd();
  const agentsFile = path.join(workspaceRoot, "AGENTS.md");
  const generatorsFile = path.join(
    workspaceRoot,
    "tools/conformance/generators.json",
  );

  const createTestingModule = async (): Promise<TestingModule> => {
    return Test.createTestingModule({
      providers: [
        ConformanceGeneratorsCommand,
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

    command = await module.resolve(ConformanceGeneratorsCommand);
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
    const logger = await module.resolve(LoggerService);

    expect(logger.setContext).toHaveBeenCalledWith(
      "ConformanceGeneratorsCommand",
    );
  });

  it.each([
    {
      agentsContent: [
        "# Header",
        "<!-- conformance-generators-table start -->",
        "| Generator | Alias | Description |",
        "| --------- | ----- | ----------- |",
        "| `alpha` | `a` | first |",
        "| `beta` | `b` | second |",
        "<!-- conformance-generators-table end -->",
      ].join("\n"),
      expectedLogMessage:
        "✅ Conformance generators table is in sync (2 generators)",
      generators: {
        alpha: {
          aliases: ["a"],
          description: "first",
          factory: "",
          schema: "",
        },
        beta: {
          aliases: ["b"],
          description: "second",
          factory: "",
          schema: "",
        },
      },
      modeArguments: ["check"],
      scenarioName:
        "passes check mode when generated table matches AGENTS markers",
    },
    {
      agentsContent: [
        "# Header",
        "<!-- conformance-generators-table start -->",
        "| Generator | Alias | Description |",
        "| --------- | ----- | ----------- |",
        "| `alpha` |  | first |",
        "<!-- conformance-generators-table end -->",
      ].join("\n"),
      expectedLogMessage:
        "✅ Conformance generators table is in sync (1 generators)",
      generators: {
        alpha: { description: "first", factory: "", schema: "" },
      },
      modeArguments: [],
      scenarioName: "defaults to check mode when no mode is provided",
    },
  ])(
    "$scenarioName",
    async ({
      agentsContent,
      expectedLogMessage,
      generators,
      modeArguments,
    }) => {
      fileContents.set(generatorsFile, JSON.stringify({ generators }));
      fileContents.set(agentsFile, agentsContent);

      await command.run(modeArguments);

      expect(logger.log).toHaveBeenCalledWith(expectedLogMessage);
      expect(writeFileSync).not.toHaveBeenCalled();
    },
  );

  it("writes generated table to AGENTS in write mode", async () => {
    fileContents.set(
      generatorsFile,
      JSON.stringify({
        generators: {
          alpha: {
            aliases: ["a"],
            description: "first",
            factory: "",
            schema: "",
          },
        },
      }),
    );
    fileContents.set(
      agentsFile,
      [
        "# Header",
        "<!-- conformance-generators-table start -->",
        "stale",
        "<!-- conformance-generators-table end -->",
      ].join("\n"),
    );

    await command.run(["write"]);

    expect(writeFileSync).toHaveBeenCalledTimes(1);
    expect(writeFileSync).toHaveBeenCalledWith(
      agentsFile,
      expect.stringContaining("| `alpha` | `a` | first |"),
      "utf8",
    );
    expect(logger.log).toHaveBeenCalledWith(
      "✅ Updated AGENTS.md with 1 generators",
    );
  });

  it("exits on invalid mode", async () => {
    fileContents.set(generatorsFile, JSON.stringify({ generators: {} }));
    fileContents.set(
      agentsFile,
      [
        "# Header",
        "<!-- conformance-generators-table start -->",
        "",
        "<!-- conformance-generators-table end -->",
      ].join("\n"),
    );

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
      scenarioName: "exits when AGENTS markers are missing",
      setup: (): void => {
        fileContents.set(generatorsFile, JSON.stringify({ generators: {} }));
        fileContents.set(agentsFile, "# Header without markers");
      },
    },
    {
      assertLogs: (loggerService: LoggerService): void => {
        expect(loggerService.log).toHaveBeenCalledWith(
          "❌ Conformance generators table in AGENTS.md is out of sync\n",
        );
        expect(loggerService.log).toHaveBeenCalledWith(
          "💡 Run 'pnpm exec nx run synchronization:start:conformance-generators-write' to sync\n",
        );
      },
      modeArguments: ["check"],
      scenarioName:
        "reports drift when generated table differs from AGENTS content",
      setup: (): void => {
        fileContents.set(
          generatorsFile,
          JSON.stringify({
            generators: {
              alpha: {
                aliases: ["a"],
                description: "first",
                factory: "",
                schema: "",
              },
            },
          }),
        );
        fileContents.set(
          agentsFile,
          [
            "# Header",
            "<!-- conformance-generators-table start -->",
            "| Generator | Alias | Description |",
            "| --------- | ----- | ----------- |",
            "| `stale` | `x` | mismatch |",
            "<!-- conformance-generators-table end -->",
          ].join("\n"),
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

        vi.mocked(readFileSync).mockImplementationOnce(() => {
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
