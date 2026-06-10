import * as fs from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";

import { LoggerService } from "../logger/logger.service";

/**
 * Download raw JSON chunks from the Epigraphik-Datenbank Clauss-Slaby API.
 */
@Command({
  description: "Download Epigraphik-Datenbank Clauss-Slaby JSON chunks",
  name: "epigraphik-datenbank-clauss-slaby",
})
@Injectable()
export class EpigraphikDatenbankClaussSlabyCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(private readonly logger: LoggerService) {
    super();
    this.logger.setContext(EpigraphikDatenbankClaussSlabyCommand.name);
  }

  // 🔐 Private Fields

  private readonly batchSize = 1000;
  private readonly dataDir = path.resolve(
    "data",
    "epigraphik-datenbank-clauss-slaby-source",
  );
  private readonly host = "https://edcs.hist.uzh.ch/api/query";
  private readonly limit = 1_000_000;

  // 🔑 Public Fields

  // 🔏 Private Methods

  private async fetchChunk(
    start: number,
    logFilePath: string,
  ): Promise<boolean> {
    const chunkFile = path.join(this.dataDir, `chunk-${start}.json`);

    try {
      // Check if file already exists
      await fs.access(chunkFile);
      this.logger.log(`⏭️ Chunk ${start} already exists, skipping.`);
      return true; // continue to next chunk
    } catch {
      // File doesn't exist, proceed with download
    }

    this.logger.log(
      `📥 Fetching records ${start} to ${start + this.batchSize}...`,
    );

    try {
      const res = await fetch(
        `${this.host}?start=${start}&length=${this.batchSize}`,
      );
      if (!res.ok) {
        this.logger.warn(`⚠️ Failed to fetch records: ${res.statusText}`);
        return true; // continue trying next ones? or false to abort? let's continue.
      }

      const data = (await res.json()) as { data: unknown[] };

      // Stop if there are no more records
      // The API returns { data: [] } when empty
      if (Array.isArray(data.data) && data.data.length === 0) {
        this.logger.log(`🛑 No more records found after ${start}. Stopping.`);
        return false; // Stop loop
      }

      await fs.writeFile(chunkFile, JSON.stringify(data, null, 2), "utf8");

      // Small delay to be polite to the API
      await new Promise((resolve) => setTimeout(resolve, 500));
      return true;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.stack || error.message : String(error);
      this.logger.error(
        `❌ Error fetching chunk at ${start}: ${String(error)}`,
      );
      await fs.appendFile(
        logFilePath,
        `[${new Date().toISOString()}] chunk-${start}: ${errorMessage}\n`,
      );
      return true;
    }
  }

  // 🌎 Public Methods

  /** Runs the ingestion of epigraphs by downloading chunks to the filesystem */
  async run(): Promise<void> {
    this.logger.log(`📁 Ensuring data directory exists at ${this.dataDir}`);
    await fs.mkdir(this.dataDir, { recursive: true });

    const outputDir = path.join(process.cwd(), "output");
    await fs.mkdir(outputDir, { recursive: true });
    const logFilePath = path.join(
      outputDir,
      `edcs-${new Date().toISOString().replaceAll(/[:.]/g, "-")}.log`,
    );

    this.logger.log(
      `🕷️ Starting Epigraphik-Datenbank Clauss-Slaby JSON ingestion...`,
    );

    for (let start = 0; start < this.limit; start += this.batchSize) {
      const shouldContinue = await this.fetchChunk(start, logFilePath);
      if (!shouldContinue) {
        break;
      }
    }

    this.logger.log("✅ Finished downloading chunks.");
  }
}
