#!/usr/bin/env tsx

/**
 * Sync agent skills table of contents into AGENTS.md
 *
 * Reads all SKILL.md files from documentation/skills/, extracts YAML frontmatter
 * (name and description), and generates a markdown table of contents that is
 * injected into the root AGENTS.md file between marker comments.
 *
 * Usage: pnpm exec nx run monorepo:sync-agent-skills [check|write]
 *   check (default): Validate that AGENTS.md has up-to-date skills table, exit 1 if not
 *   write: Update AGENTS.md with generated skills table
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import _ from "lodash";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WORKSPACE_ROOT = path.join(__dirname, "..");
const SKILLS_DIR = path.join(WORKSPACE_ROOT, "documentation/skills");
const AGENTS_FILE = path.join(WORKSPACE_ROOT, "AGENTS.md");
const MODE = process.argv[2] || "check";

interface Skill {
  name: string;
  description: string;
  filePath: string;
}

/**
 * Extract YAML frontmatter from markdown content
 */
function extractFrontmatter(content: string): Record<string, string> {
  const match = /^---\n([\s\S]*?)\n---/.exec(content);
  if (!match) {
    return {};
  }

  const frontmatter: Record<string, string> = {};
  const lines = match[1]?.split("\n") ?? [];

  for (const line of lines) {
    const [key, ...valueParts] = line.split(":");
    if (key && valueParts.length > 0) {
      frontmatter[key.trim()] = valueParts.join(":").trim();
    }
  }

  return frontmatter;
}

/**
 * Read all skills from documentation/skills/
 */
function readSkills(): Skill[] {
  const skills: Skill[] = [];
  const entries = readdirSync(SKILLS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === "README.md") {
      continue;
    }

    const skillPath = path.join(SKILLS_DIR, entry.name, "SKILL.md");
    try {
      const content = readFileSync(skillPath, "utf8");
      const frontmatter = extractFrontmatter(content);

      if (frontmatter["name"] && frontmatter["description"]) {
        skills.push({
          name: frontmatter["name"],
          description: frontmatter["description"],
          filePath: `documentation/skills/${entry.name}/SKILL.md`,
        });
      }
    } catch {
      // Skip if SKILL.md doesn't exist or can't be read
      continue;
    }
  }

  return _.sortBy(skills, (skill: Skill) => skill.name);
}

/**
 * Generate markdown table of skills
 */
function generateSkillsTable(skills: Skill[]): string {
  const rows = skills.map((skill) => {
    const link = `[${skill.name}](${skill.filePath})`;
    return `- **${link}**: ${skill.description}`;
  });

  return rows.join("\n");
}

/**
 * Read AGENTS.md and extract existing content and generated section
 */
function readAgentsFile(): {
  beforeMarker: string;
  generatedContent: string;
  afterMarker: string;
} {
  const content = readFileSync(AGENTS_FILE, "utf8");
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

  return { beforeMarker, generatedContent, afterMarker };
}

/**
 * Check if the generated content matches the stored content
 */
function checkSync(skills: Skill[]): boolean {
  const generatedTable = generateSkillsTable(skills);
  const existingContent = readAgentsFile();

  // Normalize whitespace for comparison
  const generated = generatedTable.trim();
  const existing = existingContent.generatedContent.trim();

  if (generated !== existing) {
    console.log("❌ Skills table of contents in AGENTS.md is out of sync\n");
    console.log(`  Found ${skills.length} skills in documentation/skills/`);
    console.log("  Generated content doesn't match stored content");
    console.log(
      "💡 Run 'pnpm exec tsx scripts/sync-agent-skills-table-of-contents.ts write' to sync\n",
    );
    return false;
  }

  console.log(
    `✅ Skills table of contents is in sync (${skills.length} skills)`,
  );
  return true;
}

/**
 * Write the generated content to AGENTS.md
 */
function writeSync(skills: Skill[]): void {
  console.log("🔄 Generating skills table of contents...");
  const generatedTable = generateSkillsTable(skills);
  const { beforeMarker, afterMarker } = readAgentsFile();

  const newContent = `${beforeMarker}\n${generatedTable}\n${afterMarker}`;

  writeFileSync(AGENTS_FILE, newContent, "utf8");
  console.log(`✅ Updated AGENTS.md with ${skills.length} skills`);
}

/**
 * Main entry point
 */
function main(): void {
  try {
    const skills = readSkills();

    if (MODE === "check") {
      const success = checkSync(skills);
      process.exit(success ? 0 : 1);
    } else if (MODE === "write") {
      writeSync(skills);
      process.exit(0);
    } else {
      console.error(`❌ Unknown mode: ${MODE}`);
      console.error("Expected 'check' or 'write'");
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
