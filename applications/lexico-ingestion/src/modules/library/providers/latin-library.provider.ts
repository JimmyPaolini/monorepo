import * as fs from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import * as cheerio from "cheerio";
import cheerioTableParser from "cheerio-tableparser";
import _ from "lodash";

import { authorIdToName } from "../../literature/literature.constants";
import { LoggerService } from "../../logger/logger.service";

import type { LibraryAuthor, LibraryWork } from "../library.types";

/**
 * Provider for scraping The Latin Library.
 */
@Injectable()
export class LatinLibraryProvider {
  constructor(private readonly logger: LoggerService) {}

  readonly name = "thelatinlibrary";

  /**
   * Fetch authors, works, and output markdown files to the data directory.
   */
  async ingest(options?: {
    author?: string;
    text?: string;
  }): Promise<LibraryAuthor[]> {
    const host = "https://www.thelatinlibrary.com/";
    this.logger.log(`Scraping library from ${host}`);

    const res = await fetch(host);
    const textData = await res.text();
    const tableHtml = cheerio.load(textData);
    cheerioTableParser(tableHtml);

    const authors: LibraryAuthor[] = tableHtml("p>table")
      .first()
      .parsetable(true, true, false)
      .flat()
      .map((elt: string): LibraryAuthor => {
        const a = cheerio.load(elt.trim())("a");
        const nickname = a.text().replace(/\s/, " ").trim().toLowerCase();
        const slug = _.kebabCase(nickname);
        const name = authorIdToName[slug] || nickname;
        const href = a.attr("href") ?? "";
        return { name, nickname, path: href, slug, works: [] };
      })
      .toSorted((a, b) => a.nickname.localeCompare(b.nickname));

    for (const author of authors) {
      if (options?.author && author.slug !== options.author) {
        continue;
      }

      this.logger.log(`Scraping author: ${author.nickname}`);

      const authorRes = await fetch(host + author.path);
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
        const rawBook = $(a)
          .closest("div")
          .prev(":header")
          .text()
          .trim()
          .toLowerCase();
        const book = rawBook ? _.startCase(rawBook) : undefined;
        const rawTitle = $(a).text().trim().toLowerCase();
        const title = rawTitle ? _.startCase(rawTitle) : "";
        const workDto: LibraryWork = { path: href, title };
        if (book !== undefined) {
          workDto.book = book;
        }
        author.works.push(workDto);
      }

      if (!author.works.every((work) => work.path.endsWith(".html"))) {
        author.works = [{ path: author.path, title: author.nickname }];
      }
    }

    const dataPath = path.resolve("data", "library", this.name);
    await fs.mkdir(dataPath, { recursive: true });

    // Fetch and generate markdown for each work
    for (const author of authors) {
      if (options?.author && author.slug !== options.author) {
        continue;
      }

      const authorPath = path.join(dataPath, author.slug);
      await fs.mkdir(authorPath, { recursive: true });

      for (const work of author.works) {
        if (!work.path.endsWith(".html")) continue;

        const safeTitle = _.kebabCase(work.title);
        const textSlug = work.book
          ? `${author.slug}/${_.kebabCase(work.book)}/${safeTitle}`
          : `${author.slug}/${safeTitle}`;
        if (options?.text && textSlug !== options.text) {
          continue;
        }

        try {
          const workRes = await fetch(host + work.path);
          const workHtml = await workRes.text();
          const $work = cheerio.load(workHtml);

          let markdown = `---\ntitle: ${work.title}\nauthor: ${author.slug}\nsource_url: ${host + work.path}\ntype: ${work.book ? "text" : "book"}\n---\n\n`;

          if (work.book) {
            markdown += `# ${work.book}\n\n`;
          }
          markdown += `## ${work.title}\n\n`;

          // Extract text primarily from <p> tags
          const paragraphs: string[] = [];
          $work("p").each((_, p) => {
            const $p = $work(p);
            // Skip navigation and footer paragraphs
            if (
              $p.hasClass("pagehead") ||
              $p.hasClass("internal_navigation") ||
              $p.find("a").length > 3
            )
              return;
            if ($p.text().trim().length === 0) return;

            let paraHtml = $p.html() || "";
            // Replace <br> with newlines, keep <b> text to detect as labels
            paraHtml = paraHtml.replaceAll(/<br\s*\/?>/gi, "\n");

            // Re-parse the paragraph to handle its text and bold nodes
            const $paraContent = cheerio.load(paraHtml);
            let paraText = "";

            $paraContent("body")
              .contents()
              .each((_, node) => {
                if ((node.type as string) === "text") {
                  paraText += $paraContent(node).text();
                } else if (
                  (node.type as string) === "tag" &&
                  "name" in node &&
                  node.name === "b"
                ) {
                  const boldText = $paraContent(node).text().trim();
                  if (boldText) paraText += `**${boldText}** `;
                } else if ((node.type as string) === "tag") {
                  paraText += $paraContent(node).text();
                }
              });

            // Clean up and add to markdown
            const lines = paraText.split("\n");
            for (let line of lines) {
              line = line.trim();
              if (!line) continue;

              const numMatch = /^(\d+[a-zA-Z]*)\.?\s+(.*)$/.exec(line);
              if (numMatch && !line.startsWith("**")) {
                line = `**${numMatch[1]}** ${numMatch[2]}`;
              }

              paragraphs.push(line);
            }
          });

          markdown += `${paragraphs.join("\n\n")}\n`;

          if ($work("p").length < 2) {
            markdown +=
              "<!-- Scraper note: Very few <p> tags found, text might be structured differently -->\n\n";
          }

          const safeTitle = _.kebabCase(work.title);
          if (work.book) {
            const safeBook = _.kebabCase(work.book);
            const bookPath = path.join(authorPath, safeBook);
            await fs.mkdir(bookPath, { recursive: true });
            await fs.writeFile(
              path.join(bookPath, `${safeTitle}.md`),
              markdown,
              "utf8",
            );
          } else {
            await fs.writeFile(
              path.join(authorPath, `${safeTitle}.md`),
              markdown,
              "utf8",
            );
          }
        } catch (error) {
          this.logger.error(
            `Failed to fetch work ${work.title}`,
            error instanceof Error ? error.stack : undefined,
          );
        }
      }
    }

    return authors;
  }
}
