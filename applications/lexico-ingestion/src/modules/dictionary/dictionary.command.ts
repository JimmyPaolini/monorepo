import fs from "node:fs";
import path from "node:path";

import { Injectable, Logger } from "@nestjs/common";
import { Command, CommandRunner, Option } from "nest-commander";
import prompts, { type Choice } from "prompts";

import { ManualService } from "../manual/manual.service.js";

import { DictionaryService } from "./dictionary.service.js";

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

  private getLemmaChoices(): Choice[] {
    const dataDir = path.join(process.cwd(), "./data/wiktionary");
    if (!fs.existsSync(dataDir)) return [];

    return fs
      .readdirSync(dataDir)
      .filter((file) => file.endsWith(".json"))
      .map((file) => {
        const title = file.replace(".json", "");
        const choice: Choice = { title, value: title };
        return choice;
      });
  }

  /**
   *
   */
  @Option({
    flags: "-s, --startLemma [lemma]",
    description: "The lemma to start ingestion from",
  })
  async parseStartLemma(value?: string | null): Promise<string | undefined> {
    if (value === null || value === undefined) return undefined;

    const choices = this.getLemmaChoices();
    if (typeof value === "string") {
      if (choices.some((choice) => choice.value === value)) {
        return value;
      } else {
        throw new Error(`Start lemma "${value}" not found in the dataset.`);
      }
    }

    const response = await prompts({
      type: "autocomplete",
      name: "startLemma",
      message: "Select the starting lemma",
      choices: [{ title: "None", value: "null" }, ...choices],
    });

    return response.startLemma === "null"
      ? undefined
      : (response.startLemma as string);
  }

  /**
   *
   */
  @Option({
    flags: "-e, --endLemma [lemma]",
    description: "The lemma to end ingestion at",
  })
  async parseEndLemma(
    value?: string | null,
    startLemma?: string | null,
  ): Promise<string | undefined> {
    if (value === null || value === undefined) return undefined;

    const choices = this.getLemmaChoices().filter((choice) => {
      if (!startLemma) return true;
      return choice.value >= startLemma;
    });
    if (typeof value === "string") {
      if (choices.some((choice) => choice.value === value)) {
        return value;
      } else {
        throw new Error(`End lemma "${value}" not found in the dataset.`);
      }
    }

    const response = await prompts({
      type: "autocomplete",
      name: "endLemma",
      message: "Select the ending lemma",
      choices: [{ title: "None", value: "null" }, ...choices],
    });

    return response.endLemma === "null"
      ? undefined
      : (response.endLemma as string);
  }

  /** Runs the dictionary ingestion for a single word when `--word` is given,
   * or processes all cached Wiktionary HTML files otherwise. */
  async run(_args: string[], options: DictionaryCommandOptions): Promise<void> {
    this.logger.log(`📖 Ingesting dictionary...`);
    const startTime = performance.now();

    const startLemma = await this.parseStartLemma(options.startLemma);
    const endLemma = await this.parseEndLemma(options.endLemma, startLemma);

    await this.dictionaryService.ingestAll(startLemma, endLemma);
    await this.manualService.ingestManual();

    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    this.logger.log(`📖 Ingested dictionary in ${duration} seconds`);
  }
}
