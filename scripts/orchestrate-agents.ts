import { spawn } from "node:child_process";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import json5 from "json5";
import _ from "lodash";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const planFile = path.join(
  __dirname,
  "..",
  "documentation",
  "planning",
  "2026-06-26T00:00:00Z-refactor-fallow-duplicates-top12.plan.json",
);

const modeSchema = z
  .enum(["parallel", "sequence"])
  .describe(
    "Run mode for Copilot sessions. 'parallel' runs all sessions concurrently, while 'sequence' runs sessions one after another.",
  );

const inputSchema = z.object({
  enableGitHubMcp: z
    .boolean()
    .default(false)
    .describe("Enable GitHub MCP toolset for each Copilot invocation."),
  enableMcpJson: z
    .boolean()
    .default(false)
    .describe("Load additional MCP configuration from .vscode/mcp.json."),
  model: z
    .string()
    .min(1)
    .default("claude-haiku-4.5")
    .describe("Model name passed to gh copilot --model."),
  name: z.string().min(1).describe("Session name passed to gh copilot --name."),
  prompt: z.string().min(1).describe("Prompt text sent to each Copilot run."),
});

/**
 * One Copilot batch run configuration loaded from JSONC input.
 */
type Input = z.infer<typeof inputSchema>;

const inputsSchema = z
  .array(inputSchema)
  .min(1)
  .max(24)
  .describe("Array of Copilot run configurations loaded from JSONC input.");

const planSchema = z.object({
  inputs: inputsSchema,
  mode: modeSchema.default("parallel"),
});

/**
 * Session failure details used to format error output.
 */
interface SessionFailureContext {
  exitCode: null | number;
  processIdentifier: "unknown" | number;
  sessionDurationMilliseconds: number;
  sessionEndTime: Date;
  sessionName: string;
  signal: NodeJS.Signals | null;
  stderrChunks: string[];
  stdoutChunks: string[];
}

/**
 * Build argument list for a single Copilot run.
 */
function buildCopilotArguments(input: Input): string[] {
  const copilotArguments = [
    "--model",
    input.model,
    "--name",
    input.name,
    "--prompt",
    input.prompt,
    "--allow-all",
    "--no-ask-user",
    "--silent",
    "--stream",
    "off",
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
 * Build a process startup failure message.
 */
function buildProcessStartFailureMessage(
  sessionName: string,
  error: Error,
): string {
  return formatLabeledMessage("Failed to start gh copilot process", [
    ["session", sessionName],
    ["error", error.message],
  ]);
}

/**
 * Build a detailed failure message when a session exits non-zero.
 */
function buildSessionFailureMessage(context: SessionFailureContext): string {
  const stdoutTail = getTailLines(context.stdoutChunks.join(""), 40);
  const stderrTail = getTailLines(context.stderrChunks.join(""), 40);

  return formatLabeledMessage(
    `Session ${context.sessionName} (pid: ${context.processIdentifier}) failed`,
    [
      ["exit code", `${context.exitCode ?? "none"}`],
      ["signal", context.signal ?? "none"],
      ["finished at", formatTimestamp(context.sessionEndTime)],
      ["duration", formatDuration(context.sessionDurationMilliseconds)],
      ["stderr (tail)", stderrTail],
      ["stdout (tail)", stdoutTail],
    ],
  );
}

/**
 * Convert elapsed milliseconds into a concise human-friendly string.
 */
function formatDuration(durationMilliseconds: number): string {
  const seconds = durationMilliseconds / 1000;

  if (seconds < 60) {
    return `${seconds.toFixed(2)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds.toFixed(2)}s`;
}

/**
 * Build labeled multi-line log messages with consistent formatting.
 */
function formatLabeledMessage(
  heading: string,
  entries: [label: string, value: string][],
): string {
  return [
    heading,
    ...entries.map(([label, value]) => `- ${label}: ${value}`),
  ].join("\n");
}

/**
 * Render timestamps consistently for log lines.
 */
function formatTimestamp(date: Date): string {
  return date.toISOString();
}

/**
 * Keep output logs concise by returning the last lines only.
 */
function getTailLines(text: string, lineLimit: number): string {
  const lines = _.compact(text.trim().split(/\r?\n/));

  if (lines.length === 0) {
    return "(no output)";
  }

  return _.takeRight(lines, lineLimit).join("\n");
}

/**
 * Read and parse the plan JSON file.
 */
async function loadPlan(): Promise<z.infer<typeof planSchema>> {
  const planFileExists = await stat(planFile)
    .then((statistics) => statistics.isFile())
    .catch(() => false);

  if (!planFileExists) {
    throw new Error(`❌ Plan file not found: ${planFile}`);
  }

  const plan = await readFile(planFile, "utf8");
  return planSchema.parse(json5.parse(plan));
}

/**
 * Log final script timing details.
 */
function logScriptCompletion(scriptStartTime: Date): void {
  const scriptEndTime = new Date();
  const scriptDurationMilliseconds =
    scriptEndTime.getTime() - scriptStartTime.getTime();
  console.log(`✅ All Copilot sessions completed`);
  console.log(
    `⏱️ Script finished at ${formatTimestamp(scriptEndTime)} (duration: ${formatDuration(scriptDurationMilliseconds)})`,
  );
}

/**
 * Run all configured Copilot prompts in parallel or sequentially based on the input file's mode.
 */
async function main(): Promise<void> {
  const scriptStartTime = new Date();
  console.log(`⏱️ Script started at ${formatTimestamp(scriptStartTime)}`);

  const { inputs, mode } = await loadPlan();
  const copilotArgumentsList = resolveCopilotArguments(inputs);

  if (copilotArgumentsList.length === 0) {
    console.warn("⚠️ No Copilot sessions to run");
    return;
  }

  await runSessions(copilotArgumentsList, mode);
  logScriptCompletion(scriptStartTime);
}

/**
 * Read a named option value from Copilot arguments when present.
 */
function readCopilotArgumentValue(
  copilotArguments: string[],
  optionName: string,
): string | undefined {
  const optionIndex = copilotArguments.indexOf(optionName);

  if (optionIndex === -1) {
    return undefined;
  }

  return copilotArguments[optionIndex + 1];
}

/**
 * Build argument arrays for each configured input.
 */
function resolveCopilotArguments(inputs: Input[]): string[][] {
  return inputs.map((input) => buildCopilotArguments(input));
}

/**
 * Run a single Copilot command and resolve when the process exits.
 */
async function runCopilotCommand(copilotArguments: string[]): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const childProcess = spawn("gh", ["copilot", "--", ...copilotArguments], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    const processIdentifier = childProcess.pid ?? "unknown";
    const sessionName =
      readCopilotArgumentValue(copilotArguments, "--name") ?? "unknown";
    const sessionStartTime = new Date();
    const stdoutChunks: string[] = [];
    const stderrChunks: string[] = [];

    console.log(
      `🚀 Launched session ${sessionName} (pid: ${processIdentifier}) at ${formatTimestamp(sessionStartTime)}`,
    );

    childProcess.stdout.on("data", (chunk: Buffer) => {
      stdoutChunks.push(chunk.toString());
    });

    childProcess.stderr.on("data", (chunk: Buffer) => {
      stderrChunks.push(chunk.toString());
    });

    childProcess.on("close", (exitCode, signal) => {
      const sessionEndTime = new Date();
      const sessionDurationMilliseconds =
        sessionEndTime.getTime() - sessionStartTime.getTime();

      if (exitCode === 0) {
        console.log(
          `✅ Session ${sessionName} finished at ${formatTimestamp(sessionEndTime)} (duration: ${formatDuration(sessionDurationMilliseconds)})`,
        );
        resolve();
        return;
      }

      reject(
        new Error(
          buildSessionFailureMessage({
            exitCode,
            processIdentifier,
            sessionDurationMilliseconds,
            sessionEndTime,
            sessionName,
            signal,
            stderrChunks,
            stdoutChunks,
          }),
        ),
      );
    });

    childProcess.on("error", (error) => {
      reject(new Error(buildProcessStartFailureMessage(sessionName, error)));
    });
  });
}

/**
 * Run configured sessions in the selected mode.
 */
async function runSessions(
  copilotArgumentsList: string[][],
  mode: z.infer<typeof modeSchema>,
): Promise<void> {
  if (mode === "parallel") {
    console.log(
      `🔀 Launching ${copilotArgumentsList.length} Copilot sessions in parallel`,
    );
    await Promise.all(
      copilotArgumentsList.map(async (copilotArguments) =>
        runCopilotCommand(copilotArguments),
      ),
    );
    return;
  }

  console.log(
    `🔁 Launching ${copilotArgumentsList.length} Copilot sessions in sequence`,
  );
  for (const copilotArguments of copilotArgumentsList) {
    await runCopilotCommand(copilotArguments);
  }
}

void main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error(`❌ Orchestrate agents failed:\n${error.message}`);
  } else {
    console.error("❌ Orchestrate agents failed with an unknown error", error);
  }
  process.exitCode = 1;
});
