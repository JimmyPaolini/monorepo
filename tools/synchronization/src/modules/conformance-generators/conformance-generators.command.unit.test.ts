import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LoggerService } from "../logger/logger.service";

import { ConformanceGeneratorsCommand } from "./conformance-generators.command";

const fileContents = new Map<string, string>();

vi.mock("node:fs", () => {
  return {
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

describe(ConformanceGeneratorsCommand, () => {
  let command: ConformanceGeneratorsCommand;
  let logger: LoggerService;

  const workspaceRoot = process.cwd();
  const agentsFile = path.join(workspaceRoot, "AGENTS.md");
  const generatorsFile = path.join(
    workspaceRoot,
    "tools/conformance/generators.json",
  );

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ConformanceGeneratorsCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

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
    const module = await Test.createTestingModule({
      providers: [
        ConformanceGeneratorsCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    const logger = await module.resolve(LoggerService);

    expect(logger.setContext).toHaveBeenCalledWith(
      "ConformanceGeneratorsCommand",
    );
  });

  it("passes check mode when generated table matches AGENTS markers", async () => {
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
          beta: {
            aliases: ["b"],
            description: "second",
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
        "| `alpha` | `a` | first |",
        "| `beta` | `b` | second |",
        "<!-- conformance-generators-table end -->",
      ].join("\n"),
    );

    await command.run(["check"]);

    expect(logger.log).toHaveBeenCalledWith(
      "✅ Conformance generators table is in sync (2 generators)",
    );
    expect(writeFileSync).not.toHaveBeenCalled();
  });

  it("defaults to check mode when no mode is provided", async () => {
    fileContents.set(
      generatorsFile,
      JSON.stringify({
        generators: {
          alpha: { description: "first", factory: "", schema: "" },
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
        "| `alpha` |  | first |",
        "<!-- conformance-generators-table end -->",
      ].join("\n"),
    );

    await command.run([]);

    expect(logger.log).toHaveBeenCalledWith(
      "✅ Conformance generators table is in sync (1 generators)",
    );
  });

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

  it("exits when AGENTS markers are missing", async () => {
    fileContents.set(generatorsFile, JSON.stringify({ generators: {} }));
    fileContents.set(agentsFile, "# Header without markers");

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

  it("reports drift when generated table differs from AGENTS content", async () => {
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

    const processExitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: null | number | string) => {
        throw new Error(`process.exit:${code ?? 0}`);
      });

    await expect(command.run(["check"])).rejects.toThrow("process.exit:1");

    expect(logger.log).toHaveBeenCalledWith(
      "❌ Conformance generators table in AGENTS.md is out of sync\n",
    );
    expect(logger.log).toHaveBeenCalledWith(
      "💡 Run 'pnpm exec nx run synchronization:sync-conformance-generators:write' to sync\n",
    );

    processExitSpy.mockRestore();
  });

  it("handles non-Error throw values in run catch block", async () => {
    const nonErrorLike: Error = {
      message: "boom",
      name: "NonErrorLike",
    };

    vi.mocked(readFileSync).mockImplementationOnce(() => {
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
