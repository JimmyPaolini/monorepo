import { Injectable } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";

import { LiteratureService } from "./literature.service.js";

/**
 * Ingest local literature texts into the database.
 */
@Command({
  description: "Ingest local literature text files into the database",
  name: "literature",
})
@Injectable()
export class LiteratureCommand extends CommandRunner {
  constructor(private readonly literatureService: LiteratureService) {
    super();
  }

  /** Runs the literature ingestion pipeline. */
  async run(): Promise<void> {
    await this.literatureService.ingestLiterature();
  }
}
