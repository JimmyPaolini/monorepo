import * as fs from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import * as cheerio from "cheerio";
import cheerioTableParser from "cheerio-tableparser";
import _ from "lodash";
import { Command, CommandRunner } from "nest-commander";

import { authorIdToName } from "../literature/literature.constants";
import { LoggerService } from "../logger/logger.service";

interface AuthorIngestionDTO {
  name: string;
  nickname: string;
  path: string;
  works: TextIngestionDTO[];
}

interface TextIngestionDTO {
  book?: string;
  path: string;
  title: string;
}

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

  // 🌎 Public Methods

  /** Scrape thelatinlibrary.com and save library.json */
  async run(): Promise<void> {
    const host = "https://www.thelatinlibrary.com/";
    this.logger.log(`Scraping library from ${host}`);

    const res = await fetch(host);
    const textData = await res.text();
    const tableHtml = cheerio.load(textData);
    cheerioTableParser(tableHtml);

    const authors: AuthorIngestionDTO[] = tableHtml("p>table")
      .first()
      .parsetable(true, true, false)
      .flat()
      .map((elt: string): AuthorIngestionDTO => {
        const a = cheerio.load(elt.trim())("a");
        const nickname = a.text().replace(/\s/, " ").trim().toLowerCase();
        const name = authorIdToName[nickname] || nickname;
        const href = a.attr("href") ?? "";
        return { name, nickname, path: href, works: [] };
      })
      .toSorted((a, b) => a.nickname.localeCompare(b.nickname));

    for (const author of authors) {
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
        const workDto: TextIngestionDTO = { path: href, title };
        if (book !== undefined) {
          workDto.book = book;
        }
        author.works.push(workDto);
      }

      if (!author.works.every((work) => work.path.endsWith(".html"))) {
        author.works = [{ path: author.path, title: author.nickname }];
      }
    }

    const dataPath = path.resolve("data", "library");
    await fs.mkdir(dataPath, { recursive: true });
    await fs.writeFile(
      path.join(dataPath, "library.json"),
      JSON.stringify(authors, null, 2),
    );
    this.logger.log("Successfully scraped library.json");

    // Fetch and generate markdown for each work
    for (const author of authors) {
      const authorPath = path.join(dataPath, author.nickname);
      await fs.mkdir(authorPath, { recursive: true });

      for (const work of author.works) {
        if (!work.path.endsWith(".html")) continue;

        try {
          this.logger.log(`Fetching work: ${work.title} (${work.path})`);
          const workRes = await fetch(host + work.path);
          const workHtml = await workRes.text();
          const $work = cheerio.load(workHtml);

          let markdown = `---\ntitle: ${work.title}\nauthor: ${author.nickname}\nsource_url: ${host + work.path}\ntype: ${work.book ? "text" : "book"}\n---\n\n`;

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

            // A basic extraction: if the paragraph starts with a <b> tag, we can make it **bold**
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

              // Check if it already starts with a number (some line numbers aren't in <b> tags)
              const numMatch = /^(\d+[a-zA-Z]*)\.?\s+(.*)$/.exec(line);
              if (numMatch && !line.startsWith("**")) {
                line = `**${numMatch[1]}** ${numMatch[2]}`;
              }

              paragraphs.push(line);
            }
          });

          markdown += `${paragraphs.join("\n\n")}\n`;

          // Also check if text is stored directly without <p> (sometimes happens)
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

          // Small delay to prevent rate-limiting
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          this.logger.warn(`Failed to fetch ${work.path}: ${error}`);
        }
      }
    }

    this.logger.log("Successfully generated markdown files.");
  }
}
