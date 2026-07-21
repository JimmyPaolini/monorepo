import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import _ from "lodash";
import { Command, CommandRunner } from "nest-commander";

import { LoggerService } from "../logger/logger.service";
import { SynchronizationModeService } from "../synchronization/synchronization-mode.service";

import {
  AGENTS_DIRECTORY,
  AGENTS_MD_FILE,
  CUSTOM_AGENTS_TOC_END,
  CUSTOM_AGENTS_TOC_START,
} from "./custom-agents.constants";

import type { CustomAgentMetadata } from "./custom-agents.types";

/**
 * CLI command that syncs the custom agents table of contents into AGENTS.md.
 * Reads all .agent.md files from .github/agents/, extracts YAML frontmatter,
 * and injects a markdown bullet list between marker comments.
 */
@Command({
  description:
    "Sync custom agents table of contents into AGENTS.md (check|write)",
  name: "custom-agents",
})
@Injectable()
export class CustomAgentsCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(
    private readonly loggerService: LoggerService,
    private readonly synchronizationModeService: SynchronizationModeService,
  ) {
    super();
    this.loggerService.setContext(CustomAgentsCommand.name);
  }

  // 🔏 Private Methods

  /**
   * Compares the generated agents list against the stored content in AGENTS.md and reports any differences.
   */
  private checkSync(agents: CustomAgentMetadata[]): boolean {
    const generatedList = this.generateAgentsList(agents);
    const { generatedContent } = this.readAgentsMdFile();

    const generated = generatedList.trim();
    const existing = generatedContent.trim();

    if (generated !== existing) {
      this.loggerService.log(
        "❌ Custom agents table of contents in AGENTS.md is out of sync\n",
      );
      this.loggerService.log(
        `  Found ${agents.length} agents in ${AGENTS_DIRECTORY}/`,
      );
      this.loggerService.log(
        "  Generated content doesn't match stored content",
      );
      this.loggerService.log(
        "💡 Run 'pnpm exec nx run synchronization:custom-agents:write' to sync\n",
      );
      return false;
    }

    this.loggerService.log(
      `✅ Custom agents table of contents is in sync (${agents.length} ${agents.length === 1 ? "agent" : "agents"})`,
    );
    return true;
  }

  /**
   * Parses YAML frontmatter from an agent file and returns it as a key-value map.
   */
  private extractFrontmatter(content: string): Record<string, string> {
    const match = /^---\n([\s\S]*?)\n---/.exec(content);
    if (!match) {
      return {};
    }

    const frontmatter: Record<string, string> = {};
    const lines = String(match[1]).split("\n");

    for (const line of lines) {
      const [key, ...valueParts] = line.split(":");
      if (key && valueParts.length > 0) {
        frontmatter[key.trim()] = valueParts.join(":").trim();
      }
    }

    return frontmatter;
  }

  /**
   * Renders the list of agents as a markdown bullet list for injection into AGENTS.md.
   */
  private generateAgentsList(agents: CustomAgentMetadata[]): string {
    const rows = agents.map((agent) => {
      const filePath = `${AGENTS_DIRECTORY}/${agent.fileName}`;
      const link = `[${agent.name}](${filePath})`;
      return `- **${link}**: ${agent.description}`;
    });

    return rows.join("\n");
  }

  /**
   * Reads all .agent.md files from .github/agents/ and returns sorted agent metadata.
   */
  private readAgents(): CustomAgentMetadata[] {
    const agentsDirectory = path.join(process.cwd(), AGENTS_DIRECTORY);
    const agents: CustomAgentMetadata[] = [];
    const entries = readdirSync(agentsDirectory, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory() || !entry.name.endsWith(".agent.md")) {
        continue;
      }

      const agentPath = path.join(agentsDirectory, entry.name);

      try {
        const content = readFileSync(agentPath, "utf8");
        const frontmatter = this.extractFrontmatter(content);
        const nameStem = entry.name.replace(/\.agent\.md$/, "");
        const rawName = frontmatter["name"];
        const rawDescription = frontmatter["description"] ?? "";

        agents.push({
          description: rawDescription.replaceAll(/^["']|["']$/g, ""),
          fileName: entry.name,
          name: rawName ? rawName.replaceAll(/^["']|["']$/g, "") : nameStem,
        });
      } catch {
        continue;
      }
    }

    return _.sortBy(agents, (agent: CustomAgentMetadata) =>
      agent.name.toLowerCase(),
    );
  }

  /**
   * Reads AGENTS.md and splits it around the custom agents table-of-contents markers.
   */
  private readAgentsMdFile(): {
    afterMarker: string;
    beforeMarker: string;
    generatedContent: string;
  } {
    const agentsMdPath = path.join(process.cwd(), AGENTS_MD_FILE);
    const content = readFileSync(agentsMdPath, "utf8");

    const startIndex = content.indexOf(CUSTOM_AGENTS_TOC_START);
    const endIndex = content.indexOf(CUSTOM_AGENTS_TOC_END);

    if (startIndex === -1 || endIndex === -1) {
      throw new Error(
        `Markers not found in AGENTS.md. Expected to find "${CUSTOM_AGENTS_TOC_START}" and "${CUSTOM_AGENTS_TOC_END}"`,
      );
    }

    const beforeMarker = content.slice(
      0,
      Math.max(0, startIndex + CUSTOM_AGENTS_TOC_START.length),
    );
    const afterMarker = content.slice(Math.max(0, endIndex));
    const generatedContent = content.slice(
      startIndex + CUSTOM_AGENTS_TOC_START.length,
      endIndex,
    );

    return { afterMarker, beforeMarker, generatedContent };
  }

  /**
   * Writes the generated agents list into AGENTS.md between the marker comments.
   */
  private writeSync(agents: CustomAgentMetadata[]): void {
    const agentsMdPath = path.join(process.cwd(), AGENTS_MD_FILE);
    this.loggerService.log("🔄 Generating custom agents table of contents...");
    const generatedList = this.generateAgentsList(agents);
    const { afterMarker, beforeMarker } = this.readAgentsMdFile();

    const newContent = `${beforeMarker}\n${generatedList}\n${afterMarker}`;

    writeFileSync(agentsMdPath, newContent, "utf8");
    const agentWord = agents.length === 1 ? "agent" : "agents";
    this.loggerService.log(
      `✅ Updated AGENTS.md with ${agents.length} ${agentWord}`,
    );
  }

  // 🌎 Public Methods

  /**
   * Runs the custom-agents sync command in check or write mode.
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
      const agents = this.readAgents();

      if (mode === "check") {
        const success = this.checkSync(agents);
        if (!success) process.exit(1);
      } else {
        this.writeSync(agents);
      }
    } catch (error) {
      this.loggerService.error(
        `❌ Error: ${error instanceof Error ? error.message : error}`,
      );
      process.exit(1);
    }
  }
}
