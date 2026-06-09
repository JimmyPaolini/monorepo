import fs from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import * as cheerio from "cheerio";
import cheerioTableParser from "cheerio-tableparser";
import { Command, CommandRunner } from "nest-commander";

import { LoggerService } from "../logger/logger.service";

import { authorIdToName } from "./library.constants";

import type { LibraryAuthor, LibraryWork } from "./library.types";

/**
 * Scrape literature data from thelatinlibrary.com to library.json.
 */
@Command({
  description: "Run the library command",
  name: "library",
})
@Injectable()
export class LibraryCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(private readonly logger: LoggerService) {
    super();
    this.logger.setContext(LibraryCommand.name);
  }

  // 🔐 Private Fields

  private readonly host = "https://www.thelatinlibrary.com/";

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

  /** Scrape thelatinlibrary.com and save library.json */
  async run(): Promise<void> {
    await this.scrapeLibrary();
  }

  /**
   *
   */
  async scrapeLibrary(): Promise<void> {
    this.logger.log(`Scraping library from ${this.host}`);

    const res = await fetch(this.host);
    const textData = await res.text();
    const tableHtml = cheerio.load(textData);
    cheerioTableParser(tableHtml);
    const authors = (
      tableHtml("p>table").first() as unknown as {
        parsetable: (a: boolean, b: boolean, c: boolean) => string[][];
      }
    )
      .parsetable(true, true, false)
      .flat()
      .map((elt: string) => {
        const a = cheerio.load(elt.trim())("a");
        const nickname = a.text().replace(/\s/, " ").trim().toLowerCase();
        const name = authorIdToName[nickname] || nickname;
        const href = a.attr("href") ?? "";
        return {
          name,
          nickname,
          path: href,
          works: [] as LibraryWork[],
        } satisfies LibraryAuthor;
      })
      .toSorted((a, b) => a.nickname.localeCompare(b.nickname));

    for (const author of authors) {
      this.logger.log(`Scraping author: ${author.nickname}`);

      const authorRes = await fetch(this.host + author.path);
      const authorText = await authorRes.text();
      const $ = cheerio.load(authorText);
      for (const a of $("a").get()) {
        const href = $(a).attr("href");
        if (
          !href ||
          href.includes("index.html") ||
          href.includes("classics.html")
        ) {
          continue;
        }
        const book = $(a).closest("div").prev(":header").text().toLowerCase();
        const title = $(a).text().toLowerCase();
        author.works.push({ book, path: href, title });
      }

      if (!author.works.every((work) => /.*.s?html/.exec(work.path))) {
        author.works = [
          { path: author.path, title: author.nickname },
        ] satisfies LibraryWork[];
      }
    }

    const dataPath = path.resolve("data", "library");
    await fs.mkdir(dataPath, { recursive: true });
    await fs.writeFile(
      path.join(dataPath, "library.json"),
      JSON.stringify(authors, null, 2),
    );
    this.logger.log("Successfully scraped library.json");
  }
}
