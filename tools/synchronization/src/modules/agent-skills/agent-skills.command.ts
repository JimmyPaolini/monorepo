import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import _ from "lodash";
import { Command, CommandRunner } from "nest-commander";

import { LoggerService } from "../logger/logger.service";

import type { AgentSkillMetadata } from "./agent-skills.types";

/**
 * CLI command that syncs the agent skills table of contents into AGENTS.md.
 * Reads all SKILL.md files from documentation/skills/, extracts YAML frontmatter,
 * and injects a markdown table between marker comments.
 */
@Command({
  description:
    "Sync agent skills table of contents into AGENTS.md (check|write)",
  name: "agent-skills",
})
@Injectable()
export class AgentSkillsCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(private readonly loggerService: LoggerService) {
    super();
    this.loggerService.setContext(AgentSkillsCommand.name);
  }

  // 🔏 Private Methods

  /**
   * Compares the generated skills table against the stored content in AGENTS.md and reports any differences.
   */
  private checkSync(skills: AgentSkillMetadata[]): boolean {
    const generatedTable = this.generateSkillsTable(skills);
    const existingContent = this.readAgentsFile();

    const generated = generatedTable.trim();
    const existing = existingContent.generatedContent.trim();

    if (generated !== existing) {
      this.loggerService.log(
        "❌ Skills table of contents in AGENTS.md is out of sync\n",
      );
      this.loggerService.log(
        `  Found ${skills.length} skills in documentation/skills/`,
      );
      this.loggerService.log(
        "  Generated content doesn't match stored content",
      );
      this.loggerService.log(
        "💡 Run 'pnpm exec nx run synchronization:agent-skills:write' to sync\n",
      );
      return false;
    }

    this.loggerService.log(
      `✅ Skills table of contents is in sync (${skills.length} skills)`,
    );
    return true;
  }

  /**
   * Parses YAML frontmatter from a SKILL.md file and returns it as a key-value map.
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
   * Renders the list of skills as a markdown bullet list for injection into AGENTS.md.
   */
  private generateSkillsTable(skills: AgentSkillMetadata[]): string {
    const rows = skills.map((skill) => {
      const link = `[${skill.name}](${skill.filePath})`;
      return `- **${link}**: ${skill.description}`;
    });

    return rows.join("\n");
  }

  /**
   * Reads AGENTS.md and splits it around the skills table-of-contents markers.
   */
  private readAgentsFile(): {
    afterMarker: string;
    beforeMarker: string;
    generatedContent: string;
  } {
    const agentsFile = path.join(process.cwd(), "AGENTS.md");
    const content = readFileSync(agentsFile, "utf8");
    const startMarker = "<!-- agent-skills-table-of-contents start -->";
    const endMarker = "<!-- agent-skills-table-of-contents end -->";

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
   * Reads all SKILL.md files from documentation/skills/, extracts frontmatter, and returns sorted skill metadata.
   */
  private readSkills(): AgentSkillMetadata[] {
    const skillsDirectory = path.join(process.cwd(), "documentation/skills");
    const skills: AgentSkillMetadata[] = [];
    const entries = readdirSync(skillsDirectory, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name === "README.md") {
        continue;
      }

      const skillPath = path.join(skillsDirectory, entry.name, "SKILL.md");
      try {
        const content = readFileSync(skillPath, "utf8");
        const frontmatter = this.extractFrontmatter(content);

        if (frontmatter["name"] && frontmatter["description"]) {
          skills.push({
            description: frontmatter["description"],
            filePath: `documentation/skills/${entry.name}/SKILL.md`,
            name: frontmatter["name"],
          });
        }
      } catch {
        continue;
      }
    }

    return _.sortBy(skills, (skill: AgentSkillMetadata) => skill.name);
  }

  /**
   * Writes the generated skills table into AGENTS.md between the marker comments.
   */
  private writeSync(skills: AgentSkillMetadata[]): void {
    const agentsFile = path.join(process.cwd(), "AGENTS.md");
    this.loggerService.log("🔄 Generating skills table of contents...");
    const generatedTable = this.generateSkillsTable(skills);
    const { afterMarker, beforeMarker } = this.readAgentsFile();

    const newContent = `${beforeMarker}\n${generatedTable}\n${afterMarker}`;

    writeFileSync(agentsFile, newContent, "utf8");
    this.loggerService.log(`✅ Updated AGENTS.md with ${skills.length} skills`);
  }

  // 🌎 Public Methods

  /**
   * Runs the agent-skills sync command in check or write mode.
   */
  async run(
    passedParameters: string[],
    _options?: Record<string, unknown>,
  ): Promise<void> {
    await Promise.resolve();
    const mode = passedParameters[0] ?? "check";

    try {
      const skills = this.readSkills();

      if (mode === "check") {
        const success = this.checkSync(skills);
        if (!success) process.exit(1);
      } else if (mode === "write") {
        this.writeSync(skills);
      } else {
        this.loggerService.error(`❌ Unknown mode: ${mode}`);
        this.loggerService.error("Expected 'check' or 'write'");
        process.exit(1);
      }
    } catch (error) {
      this.loggerService.error(
        `❌ Error: ${error instanceof Error ? error.message : error}`,
      );
      process.exit(1);
    }
  }
}
