import fs from "node:fs";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import * as cheerio from "cheerio";

import { LoggerService } from "../logger/logger.service.js";

import { categories } from "./wiktionary.constants.js";

import type { Category } from "./wiktionary.types.js";
import type { WiktionaryPage } from "../lexico-ingestion/lexico-ingestion.types.js";

/**
 * Provides Wiktionary entry fetching and parsing utilities.
 * Uses Cheerio for DOM querying with `unknown` typing to work around
 * TypeScript resolution issues with cheerio's type exports.
 */
@Injectable()
export class WiktionaryService {
  // 🏗️ Dependency Injection
  constructor(private readonly logger: LoggerService) {
    this.logger.setContext(WiktionaryService.name);
  }

  // 🔐 Private Fields
  private readonly directory = path.join(process.cwd(), "./data/wiktionary");
  private readonly host = "https://en.wiktionary.org";
  private readonly maxRetries = 5;
  private readonly maxRetryDelayMilliseconds = 60_000;
  private readonly requestDelayMilliseconds = 500;

  // 🔑 Public Fields

  // 🔏 Private Methods

  private async fetchWithRetry(
    url: string,
    retries = this.maxRetries,
  ): Promise<Response> {
    for (let attempt = 0; attempt <= retries; attempt++) {
      const response = await fetch(url);

      if (response.status !== 429) return response;

      const retryAfter = response.headers.get("Retry-After");
      const backoffMilliseconds = Math.min(
        retryAfter ? Number(retryAfter) * 1000 : 1000 * 2 ** attempt,
        this.maxRetryDelayMilliseconds,
      );

      this.logger.warn(
        `⏳ Rate limited — waiting ${(backoffMilliseconds / 1000).toFixed(1)}s (attempt ${attempt.toString()}/${retries.toString()})`,
      );
      await new Promise((resolve) => setTimeout(resolve, backoffMilliseconds));
    }

    // Final attempt — let caller handle non-ok response
    return fetch(url);
  }

  // 🌎 Public Methods

  /** Scrapes every configured Latin category from Wiktionary, stores each
   * article's HTML as a JSON file under `./data/wiktionary`, following
   * pagination until all pages in each category are exhausted. */
  async ingestWiktionary(): Promise<void> {
    this.logger.log(`🌐 Ingesting wiktionary`);
    if (!fs.existsSync(this.directory)) {
      fs.mkdirSync(this.directory, { recursive: true });
    }
    for (const category of Object.keys(categories).filter(
      (key): key is Category => Object.hasOwn(categories, key),
    )) {
      await this.ingestCategory(category);
    }
    this.logger.log(`🌐 Ingested wiktionary`);
  }

  private async ingestCategory(
    category: Category = "lemma",
    startPath?: string,
  ): Promise<void> {
    this.logger.log(`🗂️ Ingesting category "${category}"`);
    let urlPath: string =
      startPath ??
      `/w/index.php?title=Category:${categories[category]}&pagefrom=a`;

    try {
      while (urlPath) {
        this.logger.log(`📄 Ingesting page "${this.host}${urlPath}"`);
        const response = await this.fetchWithRetry(this.host + urlPath);
        if (!response.ok)
          throw new Error(
            `HTTP ${response.status.toString()} ${response.statusText}`,
          );
        const html = await response.text();
        const $ = cheerio.load(html);

        for (const a of $(
          "#mw-pages div.mw-category > div.mw-category-group > ul > li a",
        )) {
          const word = $(a).text();
          const href = $(a).attr("href") ?? "";
          if (/(Reconstruction:)|(Appendix:)/gi.test(word)) continue;
          if (word.includes("/")) continue; // skip subpage entries (e.g. "a/languages A to L")
          try {
            await this.ingestWord(word, href, category);
            await new Promise((resolve) =>
              setTimeout(resolve, this.requestDelayMilliseconds),
            );
          } catch (wordError) {
            this.logger.error(
              `❌ Error ingesting word "${word}" - ${String(wordError)}`,
            );
          }
        }

        urlPath = $('a:contains("next page")').eq(0).attr("href") ?? "";

        this.logger.log(`📄 Ingested page "${this.host}${urlPath}"`);
      }
      this.logger.log(`🗂️ Ingested category "${category}"`);
    } catch (error) {
      this.logger.error(
        `❌ Error ingesting category "${category}" at url "${this.host}${urlPath}" - ${String(error)}`,
      );
    }
  }

  private escapeCapitals(word: string): string {
    return word.replaceAll(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
  }

  private async ingestWord(
    word: string,
    urlPath: string,
    category: string,
  ): Promise<void> {
    if (!urlPath.includes("#Latin")) urlPath += "#Latin";
    const entry: WiktionaryPage = {
      word,
      category,
      href: `${this.host}${urlPath}`,
    };

    this.logger.log(`💬 Ingesting word "${entry.word}"`);

    if (entry.href.includes("/w/index.php")) {
      this.logger.warn(`⚠️ "${entry.word}" - no wiktionary page`);
      return;
    }

    const response = await this.fetchWithRetry(entry.href);
    if (!response.ok)
      throw new Error(
        `HTTP ${response.status.toString()} ${response.statusText}`,
      );
    const html = await response.text();
    const $ = cheerio.load(html);
    // Wiktionary changed from <span id="Latin"> to <h2 id="Latin"> inside <div class="mw-heading mw-heading2">
    // Sections are now separated by .mw-heading2 divs instead of <hr>
    const section = $("#Latin")
      .parent()
      .nextUntil(".mw-heading.mw-heading2, hr");

    if (section.length === 0) {
      this.logger.warn(`⚠️ "${entry.word}" - no latin entry in wiktionary`);
      return;
    }

    const entryWithHtml: WiktionaryPage = {
      ...entry,
      html: `<div class="${entry.word}">${$.html(section)}</div>`,
    };

    const filePath = path.join(
      this.directory,
      `${this.escapeCapitals(entry.word)}.json`,
    );
    fs.writeFileSync(filePath, JSON.stringify(entryWithHtml));
    this.logger.log(`💬 Ingested word "${entry.word}"`);
  }
}
