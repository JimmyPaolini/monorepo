import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";

import { LoggerService } from "../logger/logger.service";
import { SynchronizationModeService } from "../synchronization/synchronization-mode.service";

import { PLAN_AGENT_CONFIGS } from "./plan-agents.constants";

import type {
  PlanAgentConfig,
  PlanAgentSkillMetadata,
} from "./plan-agents.types";

/**
 * CLI command that regenerates plan agent files in .github/agents/ from their source SKILL.md files.
 * Combines static agent config (tools, model, infer, handoffs) with dynamic SKILL.md metadata
 * (name, description, argument-hint) and body content to produce the complete agent file.
 */
@Command({
  description:
    "Sync plan agent files from their SKILL.md sources (check|write)",
  name: "plan-agents",
})
@Injectable()
export class PlanAgentsCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(
    private readonly loggerService: LoggerService,
    private readonly synchronizationModeService: SynchronizationModeService,
  ) {
    super();
    this.loggerService.setContext(PlanAgentsCommand.name);
  }

  // 🔏 Private Methods

  /**
   * Checks a single agent file against expected generated content. Returns false if out of sync.
   */
  private checkAgentFile(
    config: PlanAgentConfig,
    agentPath: string,
    expectedContent: string,
  ): boolean {
    let actualContent: string;
    try {
      actualContent = readFileSync(agentPath, "utf8");
    } catch {
      this.loggerService.log(`❌ Agent file not found: ${config.agentFile}`);
      return false;
    }

    if (expectedContent !== actualContent) {
      this.loggerService.log(`❌ Agent file out of sync: ${config.agentFile}`);
      return false;
    }

    return true;
  }

  /**
   * Compares each agent file against the content generated from its SKILL.md source.
   * Returns true when all agent files are in sync.
   */
  private checkSync(workspaceRoot: string): boolean {
    let allInSync = true;

    for (const config of PLAN_AGENT_CONFIGS) {
      const skillPath = path.join(workspaceRoot, config.skillFile);
      const agentPath = path.join(workspaceRoot, config.agentFile);
      const skill = this.readSkill(skillPath);
      const expectedContent = this.generateAgentFile(config, skill);

      if (!this.checkAgentFile(config, agentPath, expectedContent)) {
        allInSync = false;
      }
    }

    if (!allInSync) {
      this.loggerService.log(
        "💡 Run 'pnpm exec nx run synchronization:plan-agents:write' to sync\n",
      );
      return false;
    }

    this.loggerService.log(
      `✅ All ${PLAN_AGENT_CONFIGS.length} plan agent files are in sync`,
    );
    return true;
  }

  /**
   * Extracts the body content from a SKILL.md file — everything after the closing frontmatter `---`.
   */
  private extractBody(content: string): string {
    const match = /^---\n[\s\S]*?\n---\n([\s\S]*)/.exec(content);
    return match?.[1] ?? "";
  }

  /**
   * Parses YAML frontmatter from a SKILL.md file and returns a flat key-value map.
   * Only handles single-line values; nested YAML blocks are intentionally skipped.
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
   * Generates the complete agent file content from static config and SKILL.md metadata.
   */
  private generateAgentFile(
    config: PlanAgentConfig,
    skill: PlanAgentSkillMetadata,
  ): string {
    const agentsYaml = config.agents.map((agent) => `  - ${agent}`).join("\n");
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
      `description: ${skill.description}`,
      `name: ${skill.name}`,
      `argument-hint: ${skill.argumentHint}`,
      `agents:`,
      agentsYaml,
      `infer: ${config.infer}`,
      `model: ${config.model}`,
      `tools:`,
      toolsYaml,
      `handoffs:`,
      handoffsYaml,
    ].join("\n");

    return `---\n${frontmatter}\n---\n${skill.body.trimEnd()}\n`;
  }

  /**
   * Reads and parses a SKILL.md file, returning extracted frontmatter fields and body content.
   */
  private readSkill(skillPath: string): PlanAgentSkillMetadata {
    const content = readFileSync(skillPath, "utf8");
    const frontmatter = this.extractFrontmatter(content);
    const body = this.extractBody(content);

    return {
      argumentHint: frontmatter["argument-hint"] ?? "",
      body,
      description: frontmatter["description"] ?? "",
      name: frontmatter["name"] ?? "",
    };
  }

  /**
   * Regenerates all agent files from their SKILL.md sources.
   */
  private writeSync(workspaceRoot: string): void {
    this.loggerService.log(
      "🔄 Syncing plan agent files from SKILL.md sources...",
    );

    for (const config of PLAN_AGENT_CONFIGS) {
      const skillPath = path.join(workspaceRoot, config.skillFile);
      const agentPath = path.join(workspaceRoot, config.agentFile);
      const skill = this.readSkill(skillPath);
      const content = this.generateAgentFile(config, skill);

      writeFileSync(agentPath, content, "utf8");
      this.loggerService.log(`✅ Synced ${config.agentFile}`);
    }
  }

  // 🌎 Public Methods

  /**
   * Runs the plan-agents sync command in check or write mode.
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

    const workspaceRoot = process.cwd();

    try {
      if (mode === "check") {
        const success = this.checkSync(workspaceRoot);
        if (!success) process.exit(1);
      } else {
        this.writeSync(workspaceRoot);
      }
    } catch (error) {
      this.loggerService.error(
        `❌ Error: ${error instanceof Error ? error.message : error}`,
      );
      process.exit(1);
    }
  }
}
