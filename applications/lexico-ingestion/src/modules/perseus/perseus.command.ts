import * as fs from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";

import { LoggerService } from "../logger/logger.service";

/**
 * Download raw XML chunks from the Perseus GitHub repository.
 */
@Command({
  description: "Download Perseus XML files locally",
  name: "perseus",
})
@Injectable()
export class PerseusCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(private readonly logger: LoggerService) {
    super();
    this.logger.setContext(PerseusCommand.name);
  }

  // 🔐 Private Fields

  private readonly dataDir = path.resolve("data", "perseus-source");

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

  /**
   *
   */
  async run(): Promise<void> {
    const host =
      "https://raw.githubusercontent.com/PerseusDL/canonical-latinLit/master/";
    const treeUrl =
      "https://api.github.com/repos/PerseusDL/canonical-latinLit/git/trees/master?recursive=1";
    this.logger.log(`🌳 Fetching Perseus tree from ${treeUrl}`);
    const treeRes = await fetch(treeUrl);

    if (!treeRes.ok) {
      this.logger.error(
        `❌ Failed to fetch Perseus tree: ${treeRes.statusText}`,
      );
      return;
    }

    const treeData = (await treeRes.json()) as {
      tree: { path: string; type: string }[];
    };

    const xmlPaths = treeData.tree
      .filter(
        (node) =>
          node.type === "blob" &&
          node.path.endsWith(".xml") &&
          node.path.includes("-lat"),
      )
      .map((node) => node.path);

    this.logger.log(
      `🗂️ Found ${xmlPaths.length} Latin XML files in Perseus repo`,
    );
    await fs.mkdir(this.dataDir, { recursive: true });

    const outputDir = path.join(process.cwd(), "output");
    await fs.mkdir(outputDir, { recursive: true });
    const logFilePath = path.join(
      outputDir,
      `perseus-${new Date().toISOString().replaceAll(/[:.]/g, "-")}.log`,
    );

    for (const xmlPath of xmlPaths) {
      const targetPath = path.join(this.dataDir, xmlPath);

      try {
        await fs.access(targetPath);
        this.logger.log(`⏭️ Skipping already downloaded: ${xmlPath}`);
        continue;
      } catch {
        // file does not exist
      }

      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      this.logger.log(`📥 Downloading: ${xmlPath}`);

      try {
        const fileUrl = host + xmlPath;
        const res = await fetch(fileUrl);
        if (!res.ok) {
          this.logger.warn(`⚠️ Failed to fetch ${fileUrl}: ${res.statusText}`);
          continue;
        }

        const xmlContent = await res.text();
        await fs.writeFile(targetPath, xmlContent, "utf8");
        await new Promise((resolve) => setTimeout(resolve, 100)); // polite delay
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.stack || error.message : String(error);
        this.logger.error(`❌ Error downloading ${xmlPath}: ${String(error)}`);
        await fs.appendFile(
          logFilePath,
          `[${new Date().toISOString()}] ${xmlPath}: ${errorMessage}\n`,
        );
      }
    }

    this.logger.log("✅ Finished downloading Perseus source files.");
  }
}
