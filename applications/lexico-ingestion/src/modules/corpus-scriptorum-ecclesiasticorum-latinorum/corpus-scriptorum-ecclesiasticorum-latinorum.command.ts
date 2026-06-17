import { existsSync, mkdirSync } from "node:fs";
import * as fs from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";

import { LoggerService } from "../logger/logger.service";

/**
 * Downloads and caches Latin XML sources from the OpenGreekAndLatin CSEL repository.
 */
@Command({
  description: "Run the corpus-scriptorum-ecclesiasticorum-latinorum command",
  name: "corpus-scriptorum-ecclesiasticorum-latinorum",
})
@Injectable()
export class CorpusScriptorumEcclesiasticorumLatinorumCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(private readonly logger: LoggerService) {
    super();
    this.logger.setContext(
      CorpusScriptorumEcclesiasticorumLatinorumCommand.name,
    );

    const outputDirectory = path.join(process.cwd(), "output");
    if (!existsSync(outputDirectory))
      mkdirSync(outputDirectory, { recursive: true });
    this.errorLogFilePath = path.join(
      outputDirectory,
      `csel-${new Date().toISOString().replaceAll(/[:.]/g, "-")}.log`,
    );
  }

  // 🔐 Private Fields

  private readonly errorLogFilePath: string;
  private readonly sourceDataDirectory = path.resolve(
    "data",
    "corpus-scriptorum-ecclesiasticorum-latinorum-source",
  );
  private readonly sourceHost =
    "https://raw.githubusercontent.com/OpenGreekAndLatin/csel-dev/master/";

  // 🔑 Public Fields

  // 🔏 Private Methods

  /**
   * Downloads one XML file unless it is already present in the local source cache.
   */
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
      const fileUrl = this.sourceHost + xmlPath;
      await this.fetchAndWriteXmlFile(fileUrl, targetPath);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.stack || error.message : String(error);
      this.logger.error(`❌ Error downloading ${xmlPath}: ${String(error)}`);
      await fs.appendFile(
        this.errorLogFilePath,
        `[${new Date().toISOString()}] ${xmlPath}: ${errorMessage}\n`,
      );
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
    }); // polite delay
  }

  /**
   * Loads the Git tree payload used to discover downloadable XML blobs.
   */
  private async fetchTree(
    treeUrl: string,
  ): Promise<null | { path: string; type: string }[]> {
    this.logger.log(`🌳 Fetching CSEL tree from ${treeUrl}`);
    const treeResponse = await fetch(treeUrl);

    if (!treeResponse.ok) {
      this.logger.error(
        `❌ Failed to fetch CSEL tree: ${treeResponse.statusText}`,
      );
      return null;
    }

    const treeData = (await treeResponse.json()) as {
      tree: { path: string; type: string }[];
    };
    return treeData.tree;
  }

  // 🌎 Public Methods

  /**
   * Downloads all eligible CSEL Latin XML source files into the local cache.
   */
  async run(): Promise<void> {
    const treeUrl =
      "https://api.github.com/repos/OpenGreekAndLatin/csel-dev/git/trees/master?recursive=1";
    const tree = await this.fetchTree(treeUrl);

    if (!tree) return;

    const xmlPaths = tree
      .filter(
        (node) =>
          node.type === "blob" &&
          node.path.startsWith("data/") &&
          node.path.endsWith(".xml") &&
          !node.path.endsWith("__cts__.xml"),
      )
      .map((node) => node.path);

    this.logger.log(`🗂️ Found ${xmlPaths.length} Latin XML files in CSEL repo`);
    await fs.mkdir(this.sourceDataDirectory, { recursive: true });

    for (const xmlPath of xmlPaths) {
      await this.downloadSourceXmlFileIfMissing(xmlPath);
    }

    this.logger.log("✅ Finished downloading CSEL source files.");
  }
}
