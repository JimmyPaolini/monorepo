import { existsSync, mkdirSync } from "node:fs";
import * as fs from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";

import { LoggerService } from "../logger/logger.service";

/**
 * Download raw JSON chunks from the Epigraphik-Datenbank Clauss-Slaby API.
 */
@Command({
  description: "Run the epigraphik-datenbank-clauss-slaby command",
  name: "epigraphik-datenbank-clauss-slaby",
})
@Injectable()
export class EpigraphikDatenbankClaussSlabyCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(private readonly logger: LoggerService) {
    super();
    this.logger.setContext(EpigraphikDatenbankClaussSlabyCommand.name);

    const outputDirectory = path.join(process.cwd(), "output");
    if (!existsSync(outputDirectory))
      mkdirSync(outputDirectory, { recursive: true });
    this.errorLogFilePath = path.join(
      outputDirectory,
      `edcs-${new Date().toISOString().replaceAll(/[:.]/g, "-")}.log`,
    );
  }

  // 🔐 Private Fields

  private readonly batchSize = 1000;
  private readonly errorLogFilePath: string;
  private readonly limit = 1_000_000;
  private readonly sourceDataDirectory = path.resolve(
    "data",
    "epigraphik-datenbank-clauss-slaby-source",
  );
  private readonly sourceHost = "https://edcs.hist.uzh.ch/api/query";

  // 🔑 Public Fields

  // 🔏 Private Methods

  private async downloadChunkData(
    start: number,
    chunkFile: string,
  ): Promise<boolean> {
    this.logger.log(
      `📥 Fetching records ${start} to ${start + this.batchSize}...`,
    );

    try {
      return await this.saveChunkData(start, chunkFile);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.stack || error.message : String(error);
      this.logger.error(
        `❌ Error fetching chunk at ${start}: ${String(error)}`,
      );
      await fs.appendFile(
        this.errorLogFilePath,
        `[${new Date().toISOString()}] chunk-${start}: ${errorMessage}\n`,
      );
      return true;
    }
  }

  private async downloadChunkIfMissing(start: number): Promise<boolean> {
    const chunkFile = path.join(
      this.sourceDataDirectory,
      `chunk-${start}.json`,
    );

    try {
      await fs.access(chunkFile);
      this.logger.log(`⏭️ Chunk ${start} already exists, skipping.`);
      return true; // continue to next chunk
    } catch {
      // File doesn't exist, proceed with download
    }

    return this.downloadChunkData(start, chunkFile);
  }

  private async saveChunkData(
    start: number,
    chunkFile: string,
  ): Promise<boolean> {
    const response = await fetch(
      `${this.sourceHost}?start=${start}&length=${this.batchSize}`,
    );
    if (!response.ok) {
      this.logger.warn(`⚠️ Failed to fetch records: ${response.statusText}`);
      return true;
    }

    const data = (await response.json()) as { data: unknown[] };

    if (Array.isArray(data.data) && data.data.length === 0) {
      this.logger.log(`🛑 No more records found after ${start}. Stopping.`);
      return false;
    }

    await fs.writeFile(chunkFile, JSON.stringify(data, null, 2), "utf8");

    await new Promise((resolve) => {
      setTimeout(resolve, 500);
    });
    return true;
  }

  // 🌎 Public Methods

  /** Runs the ingestion of epigraphs by downloading chunks to the filesystem */
  async run(): Promise<void> {
    this.logger.log(
      `📁 Ensuring data directory exists at ${this.sourceDataDirectory}`,
    );
    await fs.mkdir(this.sourceDataDirectory, { recursive: true });

    this.logger.log(
      `🕷️ Starting Epigraphik-Datenbank Clauss-Slaby JSON ingestion...`,
    );

    for (let start = 0; start < this.limit; start += this.batchSize) {
      const shouldContinue = await this.downloadChunkIfMissing(start);
      if (!shouldContinue) {
        break;
      }
    }

    this.logger.log("✅ Finished downloading chunks.");
  }
}
