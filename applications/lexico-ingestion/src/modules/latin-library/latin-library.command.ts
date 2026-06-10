import * as fs from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import * as cheerio from "cheerio";
import cheerioTableParser from "cheerio-tableparser";
import { Command, CommandRunner } from "nest-commander";

import { LoggerService } from "../logger/logger.service";

/**
 * Download HTML files from The Latin Library.
 */
@Command({
  description: "Download The Latin Library HTML files locally",
  name: "latin-library",
})
@Injectable()
export class LatinLibraryCommand extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(private readonly logger: LoggerService) {
    super();
    this.logger.setContext(LatinLibraryCommand.name);
  }

  // 🔐 Private Fields

  private readonly dataDir = path.resolve("data", "latin-library-source");

  // 🔑 Public Fields

  // 🔏 Private Methods

  private async fetchAndSave(urlStr: string, host: string): Promise<string> {
    const parsed = new URL(urlStr, host);
    let relative = parsed.pathname;
    if (relative.startsWith("/")) relative = relative.slice(1);
    if (!relative) relative = "index.html";
    if (relative.endsWith("/")) relative += "index.html";

    const targetPath = path.join(this.dataDir, relative);

    try {
      const existing = await fs.readFile(targetPath, "utf8");
      return existing;
    } catch {
      // File does not exist, continue to download
    }

    this.logger.log(`Downloading: ${parsed.href}`);
    try {
      const res = await fetch(parsed.href);
      if (!res.ok) {
        this.logger.warn(`Failed to fetch ${parsed.href}: ${res.statusText}`);
        return "";
      }

      const text = await res.text();
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, text, "utf8");
      await new Promise((resolve) => setTimeout(resolve, 100)); // Polite delay
      return text;
    } catch (error) {
      this.logger.error(`Error downloading ${parsed.href}: ${String(error)}`);
      return "";
    }
  }

  // 🌎 Public Methods

  /**
   *
   */
  async run(): Promise<void> {
    const host = "https://www.thelatinlibrary.com/";
    this.logger.log(`Starting to scrape The Latin Library from ${host}`);

    await fs.mkdir(this.dataDir, { recursive: true });

    // 1. Fetch index
    const indexHtml = await this.fetchAndSave(host, host);
    const $index = cheerio.load(indexHtml);
    cheerioTableParser($index);

    const authorUrls: string[] = [];

    $index("p>table")
      .first()
      .find("a")
      .each((_i, a) => {
        const href = $index(a).attr("href")?.trim();
        if (href && !href.includes("index.html")) {
          authorUrls.push(href);
        }
      });

    const categoryHrefs = new Set([
      "christian.html",
      "ius.html",
      "medieval.html",
      "misc.html",
      "neo.html",
    ]);

    const finalAuthorUrls: string[] = [];

    // 2. Resolve categories
    for (const href of authorUrls) {
      if (categoryHrefs.has(href)) {
        const catHtml = await this.fetchAndSave(new URL(href, host).href, host);
        const $cat = cheerio.load(catHtml);

        $cat("table a").each((_i, a) => {
          const childHref = $cat(a).attr("href")?.trim();
          if (
            childHref &&
            !childHref.includes("index.html") &&
            !childHref.includes("classics.html")
          ) {
            finalAuthorUrls.push(
              childHref.startsWith("/") ? childHref.slice(1) : childHref,
            );
          }
        });
      } else {
        finalAuthorUrls.push(href);
      }
    }

    // 3. Visit authors and find text URLs
    for (const authorHref of finalAuthorUrls) {
      const authorUrl = new URL(authorHref, host).href;
      const authorHtml = await this.fetchAndSave(authorUrl, host);
      const $author = cheerio.load(authorHtml);

      $author("a").each((_i, a) => {
        const href = $author(a).attr("href")?.trim();
        if (
          !href ||
          href.includes("index.html") ||
          href.includes("classics.html") ||
          href.includes("medieval.html") ||
          href.includes("neo.html") ||
          href.includes("christian.html") ||
          href.includes("misc.html") ||
          href.includes("ius.html")
        ) {
          return;
        }

        const normalizedHref = href.toLowerCase();
        if (
          !normalizedHref.endsWith(".html") &&
          !normalizedHref.endsWith(".htm") &&
          !normalizedHref.endsWith(".shtml")
        ) {
          return;
        }

        const absoluteUrl = new URL(href, authorUrl).href;
        const parsedUrl = new URL(absoluteUrl);
        const parsedAuthorUrl = new URL(authorUrl);

        if (
          parsedUrl.hostname === "www.thelatinlibrary.com" &&
          parsedUrl.pathname !== parsedAuthorUrl.pathname
        ) {
          // Fire and forget download for text page
          this.fetchAndSave(absoluteUrl, host).catch(() => {});
        }
      });
    }

    this.logger.log("Finished scraping The Latin Library.");
  }
}
