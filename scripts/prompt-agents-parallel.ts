import { exec } from "node:child_process";
import { glob, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import json5 from "json5";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const inputFile = path.join(__dirname, "..", "notepads", "notepad.jsonc");

const inputSchema = z.object({
  enableGitHubMcp: z
    .boolean()
    .default(false)
    .describe("Enable GitHub MCP toolset for each Copilot invocation."),
  enableMcpJson: z
    .boolean()
    .default(false)
    .describe("Load additional MCP configuration from .vscode/mcp.json."),
  globs: z
    .array(z.string().min(1))
    .min(1)
    .describe(
      "Glob patterns resolved into files and directories used as attachments.",
    ),
  model: z
    .string()
    .min(1)
    .default("claude-haiku-4.5")
    .describe("Model name passed to gh copilot --model."),
  prompt: z.string().min(1).describe("Prompt text sent to each Copilot run."),
});

/**
 * One Copilot batch run configuration loaded from JSONC input.
 */
type Input = z.infer<typeof inputSchema>;

const inputsSchema = z
  .array(inputSchema)
  .min(1)
  .max(12)
  .describe("Array of Copilot run configurations loaded from JSONC input.");

/**
 * Build argument list for a single Copilot run.
 */
function buildCopilotArguments(attachments: string[], input: Input): string[] {
  const copilotArguments = [
    "--model",
    input.model,
    "--prompt",
    input.prompt,
    ...attachments.flatMap((attachmentPath) => [
      "--attachment",
      attachmentPath,
    ]),
    "--allow-all-tools",
    "--allow-all-paths",
    "--no-ask-user",
    "--silent",
    "--stream off",
  ];

  if (input.enableGitHubMcp) {
    copilotArguments.push("--add-github-mcp-toolset", "all");
  }

  if (input.enableMcpJson) {
    copilotArguments.push("--additional-mcp-config", "@.vscode/mcp.json");
  }

  return copilotArguments;
}

/**
 * Build the full gh copilot command from arguments.
 */
function buildCopilotCommand(copilotArguments: string[]): string {
  const copilotCommand = `gh copilot -- ${copilotArguments
    .map((copilotArgument) => {
      const escaped = `'${copilotArgument.replaceAll("'", String.raw`'\\''`)}'`;
      return escaped;
    })
    .join(" ")}`;
  return copilotCommand;
}

/**
 * Return all file paths found in a directory tree in sorted order.
 */
async function getAttachmentsByDirectory(
  directoryPath: string,
): Promise<string[]> {
  const directoryEntries = await readdir(directoryPath, {
    withFileTypes: true,
  });
  const directoryEntriesSorted = directoryEntries.toSorted((left, right) =>
    left.name.localeCompare(right.name),
  );
  const files: string[] = [];

  for (const directoryEntry of directoryEntriesSorted) {
    const entryPath = path.join(directoryPath, directoryEntry.name);

    if (directoryEntry.isFile()) {
      files.push(entryPath);
      continue;
    }

    if (directoryEntry.isDirectory()) {
      const nestedFiles = await getAttachmentsByDirectory(entryPath);
      files.push(...nestedFiles);
    }
  }

  return files;
}

/**
 * Resolve file attachments for a glob pattern, logging warnings when none are found.
 */
async function getAttachmentsByGlob(
  inputGlob: string,
): Promise<string[] | undefined> {
  const resolvedPaths = await getResolvedPathsByGlob(inputGlob);

  if (!resolvedPaths) {
    return undefined;
  }

  const attachments: string[] = [];
  for (const resolvedPath of resolvedPaths) {
    const pathAttachments = await getAttachmentsByPath(resolvedPath);
    attachments.push(...pathAttachments);
  }

  if (attachments.length === 0) {
    console.warn(`⚠️ No files found for glob pattern: ${inputGlob}`);
    return undefined;
  }

  return attachments.toSorted((left, right) => left.localeCompare(right));
}

/**
 * Resolve all files for a given path (file or directory).
 */
async function getAttachmentsByPath(inputPath: string): Promise<string[]> {
  const pathStatistics = await stat(inputPath);

  if (pathStatistics.isFile()) {
    return [inputPath];
  }

  if (!pathStatistics.isDirectory()) {
    return [];
  }

  const attachments = await getAttachmentsByDirectory(inputPath);
  return attachments;
}

/**
 * Resolve and sort all paths matching a glob pattern.
 */
async function getResolvedPathsByGlob(
  inputGlob: string,
): Promise<string[] | undefined> {
  try {
    const resolvedPaths: string[] = [];

    for await (const resolvedPath of glob(inputGlob)) {
      resolvedPaths.push(resolvedPath);
    }

    if (resolvedPaths.length === 0) {
      console.warn(`⚠️ No paths match glob pattern: ${inputGlob}`);
      return undefined;
    }

    return resolvedPaths.toSorted((left, right) => left.localeCompare(right));
  } catch {
    console.warn(`⚠️ Invalid glob pattern: ${inputGlob}`);
    return undefined;
  }
}

/**
 * Run all configured Copilot prompts in parallel.
 */
async function main(): Promise<void> {
  const fileContent = await readFile(inputFile, "utf8");
  const inputs = inputsSchema.parse(json5.parse(fileContent));

  for (const input of inputs) {
    for (const inputGlob of input.globs) {
      const attachments = await getAttachmentsByGlob(inputGlob);
      if (!attachments) {
        continue;
      }

      const copilotArguments = buildCopilotArguments(attachments, input);
      const copilotCommand = buildCopilotCommand(copilotArguments);

      const childProcess = exec(copilotCommand);
      console.log(
        `🚀 Launched process (pid: ${childProcess.pid ?? "unknown"}): ${copilotCommand}`,
      );
    }
  }

  console.log(`✅ Launched all Copilot sessions`);
}

void main();
