import { existsSync, mkdirSync } from "node:fs";
import * as fs from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";

import { LoggerService } from "../logger/logger.service";

/**
 * Downloads and caches Latin XML sources from the Perseus canonical-latinLit repository.
 */
@Command({
  description: "Run the perseus command",
  name: "perseus",
})
@Injectable()
export class PerseusCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(private readonly logger: LoggerService) {
    super();
    this.logger.setContext(PerseusCommand.name);

    const outputDirectory = path.join(process.cwd(), "output");
    if (!existsSync(outputDirectory))
      mkdirSync(outputDirectory, { recursive: true });
    this.errorLogFilePath = path.join(
      outputDirectory,
      `perseus-${new Date().toISOString().replaceAll(/[:.]/g, "-")}.log`,
    );
  }

  // 🔐 Private Fields

  private readonly errorLogFilePath: string;
  private readonly sourceDataDirectory = path.resolve("data", "perseus-source");
  private readonly sourceHost =
    "https://raw.githubusercontent.com/PerseusDL/canonical-latinLit/master/";

  // 🔑 Public Fields

  // 🔏 Private Methods

  private async appendSourceDownloadErrorLog(
    xmlPath: string,
    error: unknown,
  ): Promise<void> {
    const errorMessage =
      error instanceof Error ? error.stack || error.message : String(error);
    this.logger.error(`❌ Error downloading ${xmlPath}: ${String(error)}`);
    await fs.appendFile(
      this.errorLogFilePath,
      `[${new Date().toISOString()}] ${xmlPath}: ${errorMessage}\n`,
    );
  }

  private async downloadSourceXmlFileIfMissing(xmlPath: string): Promise<void> {
    const targetPath = path.join(this.sourceDataDirectory, xmlPath);
    try {
      await fs.access(targetPath);
      this.logger.log(`⏭️ Skipping already downloaded: ${xmlPath}`);
      return;
    } catch {
      // file does not exist
    }
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    this.logger.log(`📥 Downloading: ${xmlPath}`);
    try {
      await this.fetchAndWriteXmlFile(this.sourceHost + xmlPath, targetPath);
    } catch (error: unknown) {
      await this.appendSourceDownloadErrorLog(xmlPath, error);
    }
  }

  private async fetchAndWriteXmlFile(
    fileUrl: string,
    targetPath: string,
  ): Promise<void> {
    const response = await fetch(fileUrl);
    if (!response.ok) {
      this.logger.warn(`⚠️ Failed to fetch ${fileUrl}: ${response.statusText}`);
      return;
    }
    const xmlContent = await response.text();
    await fs.writeFile(targetPath, xmlContent, "utf8");
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
  }

  private async fetchSourceXmlPaths(): Promise<null | string[]> {
    const treeUrl =
      "https://api.github.com/repos/PerseusDL/canonical-latinLit/git/trees/master?recursive=1";
    this.logger.log(`🌳 Fetching Perseus tree from ${treeUrl}`);
    const treeResponse = await fetch(treeUrl);
    if (!treeResponse.ok) {
      this.logger.error(
        `❌ Failed to fetch Perseus tree: ${treeResponse.statusText}`,
      );
      return null;
    }
    const treeData = (await treeResponse.json()) as {
      tree: { path: string; type: string }[];
    };
    return treeData.tree
      .filter(
        (node) =>
          node.type === "blob" &&
          node.path.endsWith(".xml") &&
          node.path.includes("-lat"),
      )
      .map((node) => node.path);
  }

  // 🌎 Public Methods

  /**
   * Discovers eligible Perseus XML files and stores missing files in the local cache.
   */
  async run(): Promise<void> {
    const xmlPaths = await this.fetchSourceXmlPaths();
    if (!xmlPaths) return;

    this.logger.log(
      `🗂️ Found ${xmlPaths.length} Latin XML files in Perseus repo`,
    );
    await fs.mkdir(this.sourceDataDirectory, { recursive: true });

    for (const xmlPath of xmlPaths) {
      await this.downloadSourceXmlFileIfMissing(xmlPath);
    }

    this.logger.log("✅ Finished downloading Perseus source files.");
  }
}
