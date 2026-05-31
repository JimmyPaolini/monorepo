import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";

import type {
  CreateNodesResultV2,
  CreateNodesV2,
} from "nx/src/project-graph/plugins";

/** Tag that marks a project as a nest-commander CLI application. */
const NEST_COMMANDER_TAG = "framework:nest-commander";

/** Matches `@Command({ name: "command-name" })` in TypeScript source files. */
const COMMAND_NAME_REGEX = /@Command\(\{[^}]*?name:\s*["']([^"']+)["']/s;

/**
 * Recursively finds all `*.command.ts` files under `dir`, excluding
 * `node_modules` directories.
 */
function findCommandFiles(dir: string): string[] {
  const results: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return results;
  }
  for (const entry of entries) {
    if (entry === "node_modules") continue;
    const fullPath = join(dir, entry);
    let isDir: boolean;
    try {
      isDir = statSync(fullPath).isDirectory();
    } catch {
      continue;
    }
    if (isDir) {
      results.push(...findCommandFiles(fullPath));
    } else if (entry.endsWith(".command.ts")) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Extracts the `name` value from a `@Command({ name: "..." })` decorator.
 * Returns `null` if no match is found.
 */
function extractCommandName(fileContent: string): string | null {
  return COMMAND_NAME_REGEX.exec(fileContent)?.[1] ?? null;
}

/**
 * Infers Nx targets for each nest-commander subcommand found in projects
 * tagged with `framework:nest-commander`.
 *
 * For every `*.command.ts` file containing `@Command({ name: "<cmd>" })`,
 * a target named `<cmd>` is created that runs:
 *   `node --import @swc-node/register/esm-register src/main.ts <project> <cmd>`
 *
 * The root command (whose name matches the project name) is skipped because
 * it is already covered by the `start` target.
 */
export const createNodesV2: CreateNodesV2 = [
  "**/project.json",
  async (
    projectConfigFiles: readonly string[],
    _options: unknown,
    context: { workspaceRoot: string },
  ): Promise<CreateNodesResultV2> => {
    const results: CreateNodesResultV2 = [];

    for (const projectConfigFile of projectConfigFiles) {
      const projectRoot = dirname(projectConfigFile);
      const fullConfigPath = join(context.workspaceRoot, projectConfigFile);

      let rawConfig: { name?: string; tags?: string[] };
      try {
        rawConfig = JSON.parse(readFileSync(fullConfigPath, "utf8")) as {
          name?: string;
          tags?: string[];
        };
      } catch {
        results.push([projectConfigFile, {}]);
        continue;
      }

      if (!rawConfig.tags?.includes(NEST_COMMANDER_TAG)) {
        results.push([projectConfigFile, {}]);
        continue;
      }

      const projectName = rawConfig.name ?? projectRoot.split("/").pop() ?? "";
      const srcDir = join(context.workspaceRoot, projectRoot, "src");
      const commandFiles = findCommandFiles(srcDir);

      const targets: Record<string, object> = {};

      for (const commandFile of commandFiles) {
        let content: string;
        try {
          content = readFileSync(commandFile, "utf8");
        } catch {
          continue;
        }
        const commandName = extractCommandName(content);
        if (!commandName || commandName === projectName) continue;

        targets[commandName] = {
          description: `Run ${projectName} ${commandName} command`,
          executor: "nx:run-commands",
          options: {
            command: `node --import @swc-node/register/esm-register src/main.ts ${commandName}`,
            cwd: projectRoot,
          },
        };
      }

      results.push([
        projectConfigFile,
        { projects: { [projectRoot]: { targets } } },
      ]);
    }

    return results;
  },
];
