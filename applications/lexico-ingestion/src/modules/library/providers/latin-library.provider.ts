import * as fs from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import * as cheerio from "cheerio";
import cheerioTableParser from "cheerio-tableparser";
import _ from "lodash";
import YAML from "yaml";

import { Author, Text } from "@monorepo/lexico-entities";

import { authorIdToName } from "../../literature/literature.constants";
import { LoggerService } from "../../logger/logger.service";

interface LocalAuthor {
  metadata?: Record<string, unknown>;
  name: string;
  nickname: string;
  path: string;
  slug: string;
  works: LocalWork[];
}

interface LocalWork {
  book?: string;
  metadata?: Record<string, unknown>;
  path: string;
  title: string;
}

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
  }): Promise<Author[]> {
    const host = "https://www.thelatinlibrary.com/";
    this.logger.log(`Scraping library from ${host}`);

    const res = await fetch(host);
    const textData = await res.text();
    const tableHtml = cheerio.load(textData);
    cheerioTableParser(tableHtml);

    const authors: LocalAuthor[] = tableHtml("p>table")
      .first()
      .parsetable(true, true, false)
      .flat()
      .map((elt: string): LocalAuthor => {
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

      const h1Text =
        $("h1.pagehead").text().trim() || $("h1").first().text().trim();
      const h2Text =
        $("h2.date").text().trim() || $("h2").first().text().trim();

      const metadata: Record<string, unknown> = {};
      if (
        h1Text &&
        h1Text.toLowerCase() !== author.name.toLowerCase() &&
        !h1Text.includes("Pagina amissa")
      ) {
        metadata["full_name"] = h1Text;
      }

      if (h2Text) {
        // Simple heuristic for (70 - 19 B.C.) etc
        const dateMatch =
          /(\d+)\s*(B\.?C\.?|A\.?D\.?)?\s*[-–]\s*(?:c\.\s*)?(\d+)\s*(B\.?C\.?|A\.?D\.?)?/i.exec(
            h2Text,
          );
        if (dateMatch) {
          const startYear = Number.parseInt(dateMatch[1] ?? "0", 10);
          const startEra =
            dateMatch[2] ||
            (dateMatch[4]?.toUpperCase().includes("B") ? "B.C." : "A.D.");
          const endYear = Number.parseInt(dateMatch[3] ?? "0", 10);
          const endEra = dateMatch[4] || "A.D.";

          metadata["birth_year"] = startEra.toUpperCase().includes("B")
            ? -startYear
            : startYear;
          metadata["death_year"] = endEra.toUpperCase().includes("B")
            ? -endYear
            : endYear;
        }
      }
      if (Object.keys(metadata).length > 0) {
        author.metadata = metadata;
      }

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
        const workDto: LocalWork = { path: href, title };
        if (book !== undefined) {
          workDto.book = book;
        }
        author.works.push(workDto);
      }

      const htmlWorks = author.works.filter((work) =>
        work.path.endsWith(".html"),
      );
      author.works =
        htmlWorks.length > 0
          ? htmlWorks
          : [{ path: author.path, title: author.nickname }];
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

          const frontmatterObj: Record<string, unknown> = {
            author: author.slug,
            text_metadata: {
              ...work.metadata,
              source_url: host + work.path,
            },
            title: work.title,
            type: work.book ? "text" : "book",
          };
          if (author.metadata) {
            frontmatterObj["author_metadata"] = author.metadata;
          }

          let markdown = `---\n${YAML.stringify(frontmatterObj)}---\n\n`;

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

    const entityAuthors: Author[] = [];

    for (const localAuthor of authors) {
      if (options?.author && localAuthor.slug !== options.author) continue;

      const authorEntity = new Author();
      authorEntity.name = localAuthor.name;
      authorEntity.slug = localAuthor.slug;
      authorEntity.metadata = localAuthor.metadata
        ? { ...localAuthor.metadata, sourceUrl: localAuthor.path }
        : { sourceUrl: localAuthor.path };
      authorEntity.texts = [];

      const booksMap = new Map<string, Text>();
      for (const localWork of localAuthor.works) {
        if (!localWork.path.endsWith(".html")) continue;

        let bookText: Text | undefined;
        if (localWork.book) {
          bookText = booksMap.get(localWork.book);
          if (!bookText) {
            bookText = new Text();
            bookText.type = "book";
            bookText.title = localWork.book;
            bookText.slug = _.kebabCase(localWork.book);
            bookText.childTexts = [];
            booksMap.set(localWork.book, bookText);
            authorEntity.texts.push(bookText);
          }
        }

        const textEntity = new Text();
        textEntity.type = "text";
        textEntity.title = localWork.title;
        textEntity.slug = _.kebabCase(localWork.title);
        textEntity.metadata = localWork.metadata
          ? { ...localWork.metadata, sourceUrl: localWork.path }
          : { sourceUrl: localWork.path };

        if (bookText) {
          bookText.childTexts.push(textEntity);
        } else {
          authorEntity.texts.push(textEntity);
        }
      }

      entityAuthors.push(authorEntity);
    }

    return entityAuthors;
  }
}
