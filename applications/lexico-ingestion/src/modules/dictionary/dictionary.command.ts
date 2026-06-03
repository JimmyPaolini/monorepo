import fs from "node:fs";
import path from "node:path";

import { Injectable, Logger } from "@nestjs/common";
import { Command, CommandRunner, Option } from "nest-commander";
import prompts from "prompts";

import { ManualService } from "../manual/manual.service";

import { DictionaryService } from "./dictionary.service";

interface DictionaryCommandOptions {
  startLemma?: string | null;
  endLemma?: string | null;
}

/**
 * Ingest dictionary entries from Wiktionary HTML data files.
 */
@Injectable()
@Command({
  name: "dictionary",
  description:
    "Process ingested Wiktionary HTML into structured dictionary lexemes",
})
export class DictionaryCommand extends CommandRunner {
  private readonly logger = new Logger(DictionaryCommand.name);

  constructor(
    private readonly dictionaryService: DictionaryService,
    private readonly manualService: ManualService,
  ) {
    super();
  }

  private getLemmaChoices(): { title: string; value: string }[] {
    const dataDir = path.join(process.cwd(), "./data/wiktionary");
    if (!fs.existsSync(dataDir)) return [];

    return fs
      .readdirSync(dataDir)
      .filter((file) => file.endsWith(".json"))
      .map((file) => {
        const title = file.replace(".json", "");
        return { title, value: title };
      });
  }

  /**
   *
   */
  @Option({
    flags: "-s, --startLemma [lemma]",
    description: "The lemma to start ingestion from",
  })
  async parseStartLemma(startLemma?: string): Promise<string | undefined> {
    if (!startLemma) return undefined;

    const choices = this.getLemmaChoices();
    if (typeof startLemma === "string") {
      if (choices.some((choice) => choice.value === startLemma)) {
        return startLemma;
      } else {
        throw new Error(
          `Start lemma "${startLemma}" not found in the dataset.`,
        );
      }
    }

    const response = (await prompts({
      type: "autocomplete",
      name: "startLemma",
      message: "Select the starting lemma",
      choices: [{ title: "None", value: null }, ...choices],
    })) as { startLemma: string | null };

    if (
      response.startLemma === null ||
      typeof response.startLemma !== "string"
    ) {
      return undefined;
    }

    return response.startLemma;
  }

  /**
   *
   */
  @Option({
    flags: "-e, --endLemma [lemma]",
    description: "The lemma to end ingestion at",
  })
  async parseEndLemma(
    endLemma?: string,
    startLemma?: string | null,
  ): Promise<string | undefined> {
    if (!endLemma) return undefined;

    const choices = this.getLemmaChoices().filter((choice) => {
      if (!startLemma) return true;
      return choice.value >= startLemma;
    });
    if (typeof endLemma === "string") {
      if (choices.some((choice) => choice.value === endLemma)) {
        return endLemma;
      } else {
        throw new Error(`End lemma "${endLemma}" not found in the dataset.`);
      }
    }

    const response = (await prompts({
      type: "autocomplete",
      name: "endLemma",
      message: "Select the ending lemma",
      choices: [{ title: "None", value: null }, ...choices],
    })) as { endLemma: string | null };

    if (response.endLemma === null || typeof response.endLemma !== "string") {
      return undefined;
    }

    return response.endLemma;
  }

  /** Runs the dictionary ingestion for a single word when `--word` is given,
   * or processes all cached Wiktionary HTML files otherwise. */
  async run(_args: string[], options: DictionaryCommandOptions): Promise<void> {
    this.logger.log(`📖 Ingesting dictionary...`);
    const startTime = performance.now();

    const startLemma = await this.parseStartLemma(
      options.startLemma ?? undefined,
    );
    const endLemma = await this.parseEndLemma(
      options.endLemma ?? undefined,
      startLemma,
    );

    await this.dictionaryService.ingestAll(startLemma, endLemma);
    await this.manualService.ingestManual();

    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    this.logger.log(`📖 Ingested dictionary in ${duration} seconds`);
  }
}
