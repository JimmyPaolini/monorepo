import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";

import { LoggerService } from "../logger/logger.service";
import { SynchronizationService } from "../synchronization/synchronization.service";

import type {
  ConformanceGeneratorMetadata,
  ConformanceGeneratorsJson,
} from "./conformance-generators.types";

/**
 * CLI command that syncs the conformance generators table into AGENTS.md.
 * Reads tools/conformance/generators.json and injects a markdown table
 * between marker comments.
 */
@Command({
  description: "Sync conformance generators table into AGENTS.md (check|write)",
  name: "conformance-generators",
})
@Injectable()
export class ConformanceGeneratorsCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(
    private readonly loggerService: LoggerService,
    private readonly synchronizationModeService: SynchronizationService,
  ) {
    super();
    this.loggerService.setContext(ConformanceGeneratorsCommand.name);
  }

  // 🔏 Private Methods

  /**
   * Compares the generated generators table against the stored content in AGENTS.md and reports any differences.
   */
  private checkSync(generators: ConformanceGeneratorMetadata[]): boolean {
    const generatedTable = this.generateGeneratorsTable(generators);
    const existingContent = this.readAgentsFile();

    const generated = generatedTable.trim();
    const existing = existingContent.generatedContent.trim();

    if (generated !== existing) {
      this.loggerService.log(
        "❌ Conformance generators table in AGENTS.md is out of sync\n",
      );
      this.loggerService.log(
        `  Found ${generators.length} generators in tools/conformance/generators.json`,
      );
      this.loggerService.log(
        "  Generated content doesn't match stored content",
      );
      this.loggerService.log(
        "💡 Run 'pnpm exec nx run synchronization:start:conformance-generators-write' to sync\n",
      );
      return false;
    }

    this.loggerService.log(
      `✅ Conformance generators table is in sync (${generators.length} generators)`,
    );
    return true;
  }

  /**
   * Renders the list of generators as a markdown table for injection into AGENTS.md.
   */
  private generateGeneratorsTable(
    generators: ConformanceGeneratorMetadata[],
  ): string {
    const header =
      "| Generator | Alias | Description |\n| --------- | ----- | ----------- |";
    const rows = generators.map((gen) => {
      const alias = gen.aliases.map((a) => `\`${a}\``).join(", ");
      return `| \`${gen.name}\` | ${alias} | ${gen.description} |`;
    });
    return [header, ...rows].join("\n");
  }

  /**
   * Reads AGENTS.md and splits it around the conformance generators table markers.
   */
  private readAgentsFile(): {
    afterMarker: string;
    beforeMarker: string;
    generatedContent: string;
  } {
    const agentsFile = path.join(process.cwd(), "AGENTS.md");
    const content = readFileSync(agentsFile, "utf8");
    const startMarker = "<!-- conformance-generators-table start -->";
    const endMarker = "<!-- conformance-generators-table end -->";

    const startIndex = content.indexOf(startMarker);
    const endIndex = content.indexOf(endMarker);

    if (startIndex === -1 || endIndex === -1) {
      throw new Error(
        `Markers not found in AGENTS.md. Expected to find "${startMarker}" and "${endMarker}"`,
      );
    }

    const beforeMarker = content.slice(
      0,
      Math.max(0, startIndex + startMarker.length),
    );
    const afterMarker = content.slice(Math.max(0, endIndex));
    const generatedContent = content.slice(
      startIndex + startMarker.length,
      endIndex,
    );

    return { afterMarker, beforeMarker, generatedContent };
  }

  /**
   * Reads tools/conformance/generators.json and returns the list of generator metadata.
   */
  private readGenerators(): ConformanceGeneratorMetadata[] {
    const generatorsFile = path.join(
      process.cwd(),
      "tools/conformance/generators.json",
    );
    const content = readFileSync(generatorsFile, "utf8");
    const json = JSON.parse(content) as ConformanceGeneratorsJson;

    return Object.entries(json.generators).map(([name, config]) => ({
      aliases: config.aliases ?? [],
      description: config.description,
      name,
    }));
  }

  /**
   * Writes the generated generators table into AGENTS.md between the marker comments.
   */
  private writeSync(generators: ConformanceGeneratorMetadata[]): void {
    const agentsFile = path.join(process.cwd(), "AGENTS.md");
    this.loggerService.log("🔄 Generating conformance generators table...");
    const generatedTable = this.generateGeneratorsTable(generators);
    const { afterMarker, beforeMarker } = this.readAgentsFile();

    const newContent = `${beforeMarker}\n${generatedTable}\n${afterMarker}`;

    writeFileSync(agentsFile, newContent, "utf8");
    this.loggerService.log(
      `✅ Updated AGENTS.md with ${generators.length} generators`,
    );
  }

  // 🌎 Public Methods

  /**
   * Runs the conformance-generators sync command in check or write mode.
   */
  async run(
    passedParameters: string[],
    _options?: Record<string, unknown>,
  ): Promise<void> {
    await Promise.resolve();
    const mode =
      this.synchronizationModeService.resolveSynchronizationModeOrExit({
        invalidModeLabel: "Unknown mode",
        loggerService: this.loggerService,
        passedParameters,
        usageMessage: "Expected 'check' or 'write'",
      });

    try {
      const generators = this.readGenerators();

      if (mode === "check") {
        const success = this.checkSync(generators);
        if (!success) process.exit(1);
      } else {
        this.writeSync(generators);
      }
    } catch (error) {
      this.loggerService.error(
        `❌ Error: ${error instanceof Error ? error.message : error}`,
      );
      process.exit(1);
    }
  }
}
