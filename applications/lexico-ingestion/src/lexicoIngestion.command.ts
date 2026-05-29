import { Injectable, Logger } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";

import { LexicoIngestionService } from "./lexicoIngestion.service";

import type { Environment } from "./lexicoIngestion.types";

/** NestJS command runner for ingesting lexical data from source files. */
@Injectable()
@Command({
  name: "ingest",
  description: "Ingest lexical data from source files",
})
export class LexicoIngestionCommand extends CommandRunner {
  readonly #logger = new Logger(LexicoIngestionCommand.name);

  constructor(private readonly lexicoIngestionService: LexicoIngestionService) {
    super();
  }

  /**
   * Runs ingestion for supported sources and persists the resulting entry.
   *
   * @param passedParams - Command-line positional parameters.
   * @param options - Validated environment options.
   */
  async run(passedParams: string[], options: Environment): Promise<void> {
    const sourcePath = passedParams[0] ?? options.INPUT_SOURCE_PATH;

    this.#logger.log(
      `Starting ingestion for source type: ${options.INPUT_SOURCE_TYPE}`,
    );
    this.#logger.log(`Source path: ${sourcePath}`);

    if (options.INPUT_SOURCE_TYPE !== "wiktionary-latin") {
      throw new Error(`Unsupported source type: ${options.INPUT_SOURCE_TYPE}`);
    }

    const record =
      await this.lexicoIngestionService.ingestWiktionaryLatin(sourcePath);

    this.#logger.log(
      `Ingestion completed successfully. Saved learning material ${record.id}.`,
    );
  }
}
