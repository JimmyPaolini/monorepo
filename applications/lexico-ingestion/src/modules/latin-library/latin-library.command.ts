import { existsSync, mkdirSync } from "node:fs";
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

    const outputDir = path.join(process.cwd(), "output");
    if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
    this.logFilePath = path.join(
      outputDir,
      `latin-library-${new Date().toISOString().replaceAll(/[:.]/g, "-")}.log`,
    );
  }

  // 🔐 Private Fields

  private readonly dataDir = path.resolve("data", "latin-library-source");
  private readonly logFilePath: string;

  // 🔑 Public Fields

  // 🔏 Private Methods

  private async fetchAndSave(urlString: string, host: string): Promise<string> {
    const parsed = new URL(urlString, host);
    let relative = parsed.pathname;
    if (relative.startsWith("/")) relative = relative.slice(1);
    if (!relative) relative = "index.html";
    if (relative.endsWith("/")) relative += "index.html";
    else if (!path.extname(relative)) relative += ".html";

    const targetPath = path.join(this.dataDir, relative);

    try {
      const existing = await fs.readFile(targetPath, "utf8");
      return existing;
    } catch {
      // File does not exist, continue to download
    }

    this.logger.log(`📥 Downloading: ${parsed.href}`);
    try {
      const res = await fetch(parsed.href);
      if (!res.ok) {
        this.logger.warn(
          `⚠️ Failed to fetch ${parsed.href}: ${res.statusText}`,
        );
        return "";
      }

      const text = await res.text();
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, text, "utf8");
      await new Promise((resolve) => setTimeout(resolve, 100)); // Polite delay
      return text;
    } catch (error) {
      this.logger.error(
        `❌ Error downloading ${parsed.href}: ${String(error)}`,
      );
      return "";
    }
  }

  // 🌎 Public Methods

  /**
   *
   */
  async run(): Promise<void> {
    const host = "https://www.thelatinlibrary.com/";
    this.logger.log(`🕷️ Starting to scrape The Latin Library from ${host}`);

    await fs.mkdir(this.dataDir, { recursive: true });

    // 1. Fetch index
    const indexHtml = await this.fetchAndSave(host, host);
    const $index = cheerio.load(indexHtml);
    cheerioTableParser($index);

    const authorUrls: string[] = [];

    $index("p>table")
      .first()
      .find("a")
      .each((_index, a) => {
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

        $cat("table a").each((_index, a) => {
          let childHref = $cat(a).attr("href")?.trim();

          // Fix malformed link in christian.html
          if (!childHref && $cat(a).text().includes("Biblia Sacra")) {
            childHref = "bible.html";
          }

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

    // 3. Visit authors and find text URLs (using BFS to crawl all sub-pages)
    const queue: string[] = [];
    const visited = new Set<string>();

    const enqueue = (url: string): void => {
      // Normalize URL (strip hash)
      const parsed = new URL(url);
      parsed.hash = "";
      const normalized = parsed.href;

      if (!visited.has(normalized)) {
        visited.add(normalized);
        queue.push(normalized);
      }
    };

    for (const authorHref of finalAuthorUrls) {
      let authorUrl = new URL(authorHref, host).href;
      if (!authorHref.endsWith("/") && !path.extname(authorHref)) {
        authorUrl += "/";
      }
      enqueue(authorUrl);
    }

    this.logger.log(
      `🕸️ Queueing ${queue.length} author root pages for deep crawl...`,
    );

    const worker = async (): Promise<void> => {
      while (queue.length > 0) {
        const urlString = queue.shift();
        if (!urlString) continue;

        try {
          const html = await this.fetchAndSave(urlString, host);
          if (!html) continue;

          // Only parse HTML files for more links
          const parsed = new URL(urlString);
          const extension = path.extname(parsed.pathname).toLowerCase();
          if (
            !extension ||
            extension === ".html" ||
            extension === ".htm" ||
            extension === ".shtml"
          ) {
            let baseUrl = urlString;
            if (!urlString.endsWith("/") && !extension) {
              baseUrl += "/";
            }

            const $ = cheerio.load(html);

            $("a").each((_index, a) => {
              const href = $(a).attr("href")?.trim();
              if (
                !href ||
                href.includes("index.html") ||
                href.includes("classics.html") ||
                href.includes("medieval.html") ||
                href.includes("neo.html") ||
                href.includes("christian.html") ||
                href.includes("misc.html") ||
                href.includes("ius.html") ||
                href.startsWith("mailto:") ||
                href.startsWith("javascript:")
              ) {
                return;
              }

              const normalizedHref = href.toLowerCase();
              if (
                !normalizedHref.endsWith(".html") &&
                !normalizedHref.endsWith(".htm") &&
                !normalizedHref.endsWith(".shtml") &&
                path.extname(normalizedHref) !== "" // allow directories
              ) {
                return;
              }

              const absoluteUrl = new URL(href, baseUrl).href;
              const nextParsed = new URL(absoluteUrl);

              if (nextParsed.hostname === "www.thelatinlibrary.com") {
                const skipPaths = [
                  "/ll1/",
                  "/ll2/",
                  "/caes/",
                  "/catullus/",
                  "/courses/",
                  "/livius/",
                  "/sallust/",
                  "/satire/",
                  "/virgil/",
                  "/historians/",
                  "/imperialism/",
                  "/law/",
                  "/about.html",
                  "/cred.html",
                  "/technical.html",
                  "/epubs.html",
                ];
                if (skipPaths.some((p) => nextParsed.pathname.startsWith(p))) {
                  return;
                }
                enqueue(absoluteUrl);
              }
            });
          }
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error
              ? error.stack || error.message
              : String(error);
          this.logger.error(
            `❌ Error processing ${urlString}: ${String(error)}`,
          );
          await fs.appendFile(
            this.logFilePath,
            `[${new Date().toISOString()}] ${urlString}: ${errorMessage}\n`,
          );
        }
      }
    };

    // Process queue with concurrency
    await Promise.all(Array.from({ length: 5 }, async () => worker()));

    this.logger.log("✅ Finished scraping The Latin Library.");
  }
}
