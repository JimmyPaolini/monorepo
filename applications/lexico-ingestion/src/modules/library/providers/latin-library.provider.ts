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
import {
  cleanBoilerplate,
  formatLineNumber,
  hasValidTextContent,
  isEnglishBoilerplate,
} from "../library.utilities";

/**
 * Provider for scraping The Latin Library.
 */
@Injectable()
export class LatinLibraryProvider {
  constructor(private readonly logger: LoggerService) {}

  readonly name = "thelatinlibrary";

  private async readLocal(urlString: string, host: string): Promise<string> {
    const parsed = new URL(urlString, host);
    let relative = parsed.pathname;
    if (relative.startsWith("/")) relative = relative.slice(1);
    if (!relative) relative = "index.html";
    if (relative.endsWith("/")) relative += "index.html";

    const targetPath = path.resolve("data", "latin-library-source", relative);
    return fs.readFile(targetPath, "utf8");
  }

  /**
   * Fetch authors, works, and output markdown files to the data directory.
   */
  async ingest(options?: {
    author?: string;
    text?: string;
  }): Promise<Author[]> {
    const host = "https://www.thelatinlibrary.com/";
    this.logger.log(`🗂️ Reading Latin Library from local cache`);

    const textData = await this.readLocal(host, host);
    const tableHtml = cheerio.load(textData);
    cheerioTableParser(tableHtml);

    const rootAuthors: Author[] = [];
    tableHtml("p>table")
      .first()
      .find("a")
      .each((_index, a) => {
        const $a = tableHtml(a);
        const nickname = $a.text().replace(/\s/, " ").trim().toLowerCase();
        const slug = _.kebabCase(nickname);
        const name = authorIdToName[slug] || nickname;
        const href = $a.attr("href")?.trim() ?? "";

        if (!href || href.includes("index.html")) return;

        const author = new Author();
        author.name = name;
        author.slug = slug;
        author.metadata = { nickname, sourceUrl: href };
        author.texts = [];
        rootAuthors.push(author);
      });

    const categoryHrefs = new Set([
      "christian.html",
      "ius.html",
      "medieval.html",
      "misc.html",
      "neo.html",
    ]);
    const authors: Author[] = [];

    for (const author of rootAuthors) {
      const href = author.metadata?.["sourceUrl"] as string;
      if (categoryHrefs.has(href)) {
        const catHtml = await this.readLocal(new URL(href, host).href, host);
        const $cat = cheerio.load(catHtml);

        $cat("table a").each((_index, a) => {
          const $a = $cat(a);
          const nickname = $a.text().replace(/\s/, " ").trim().toLowerCase();
          if (!nickname) return;

          const slug = _.kebabCase(nickname);
          const name = authorIdToName[slug] || nickname;
          let childHref = $a.attr("href")?.trim() ?? "";

          if (
            !childHref ||
            childHref.includes("index.html") ||
            childHref.includes("classics.html")
          ) {
            return;
          }

          if (childHref.startsWith("/")) {
            childHref = childHref.slice(1);
          }

          const childAuthor = new Author();
          childAuthor.name = name;
          childAuthor.slug = slug;
          childAuthor.metadata = { nickname, sourceUrl: childHref };
          childAuthor.texts = [];
          authors.push(childAuthor);
        });
      } else {
        authors.push(author);
      }
    }

    authors.sort((a, b) => {
      const nickA = (a.metadata?.["nickname"] as string) || "";
      const nickB = (b.metadata?.["nickname"] as string) || "";
      return nickA.localeCompare(nickB);
    });

    let authorsToProcess = authors;
    if (options?.author) {
      authorsToProcess = authors.filter((a) => a.slug === options.author);
    }
    let currentAuthor = 0;
    const totalAuthors = authorsToProcess.length;

    for (const author of authorsToProcess) {
      const nickname = author.metadata?.["nickname"] as string;
      const authorPath = author.metadata?.["sourceUrl"] as string;
      this.logger.log(`👤 Starting author metadata: ${nickname}`);

      const authorUrlObject = new URL(authorPath, host);
      const authorText = await this.readLocal(authorUrlObject.href, host);
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
        author.metadata = { ...author.metadata, ...metadata };
      }

      const booksMap = new Map<string, Text>();

      for (const a of $("a").get()) {
        const href = $(a).attr("href")?.trim();
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
          continue;
        }

        const normalizedHref = href.toLowerCase();
        if (
          !normalizedHref.endsWith(".html") &&
          !normalizedHref.endsWith(".htm") &&
          !normalizedHref.endsWith(".shtml")
        ) {
          continue;
        }

        const absoluteUrl = new URL(href, authorUrlObject.href).href;
        const parsedUrl = new URL(absoluteUrl);
        const parsedAuthorUrl = authorUrlObject;

        // Skip external links and breadcrumb links back to the author's own index page
        if (
          parsedUrl.hostname !== "www.thelatinlibrary.com" ||
          parsedUrl.pathname === parsedAuthorUrl.pathname
        ) {
          continue;
        }

        let rawBook = $(a)
          .closest("div")
          .prev(":header")
          .text()
          .trim()
          .toLowerCase();

        if (!rawBook) {
          const parentTable = $(a).closest("table");
          if (parentTable.length > 0) {
            const outerTable = parentTable.parents("table").last();
            const tableToCheck =
              outerTable.length > 0 ? outerTable : parentTable;

            let previous = tableToCheck.prev();
            while (previous.length > 0 && !previous.text().trim()) {
              previous = previous.prev();
            }
            if (previous.length > 0) {
              rawBook = previous.text().trim().toLowerCase();
            }
          }
        }

        const book = rawBook ? _.startCase(rawBook) : undefined;
        const rawTitle = $(a).text().trim().toLowerCase();
        const title = rawTitle ? _.startCase(rawTitle) : "";

        const textEntity = new Text();
        textEntity.type = "text";
        textEntity.title = title;
        textEntity.slug = _.kebabCase(title);
        textEntity.metadata = { sourceUrl: absoluteUrl };

        if (book === undefined) {
          author.texts.push(textEntity);
        } else {
          let bookText = booksMap.get(book);
          if (!bookText) {
            bookText = new Text();
            bookText.type = "book";
            bookText.title = book;
            bookText.slug = _.kebabCase(book);
            bookText.childTexts = [];
            booksMap.set(book, bookText);
            author.texts.push(bookText);
          }
          textEntity.metadata["book"] = book;
          bookText.childTexts.push(textEntity);
        }
      }

      if (author.texts.length === 0) {
        const fallback = new Text();
        fallback.title = author.metadata?.["nickname"] as string;
        fallback.slug = _.kebabCase(fallback.title);
        fallback.type = "text";
        fallback.metadata = { sourceUrl: authorUrlObject.href };
        author.texts = [fallback];
      }

      currentAuthor++;
      const authorProgress = ` (${((currentAuthor / totalAuthors) * 100).toFixed(2)}%, ${currentAuthor}/${totalAuthors})`;
      this.logger.log(
        `👤 Completed author metadata: ${nickname}${authorProgress}`,
      );
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

      const allTextNodes = author.texts.flatMap((t) =>
        t.type === "book" ? t.childTexts : [t],
      );

      let currentText = 0;
      const totalTexts = allTextNodes.length;

      for (const work of allTextNodes) {
        const workPath = work.metadata?.["sourceUrl"] as string;
        const workBook = work.metadata?.["book"] as string | undefined;

        const safeTitle = _.kebabCase(work.title);
        const textSlug = workBook
          ? `${author.slug}/${_.kebabCase(workBook)}/${safeTitle}`
          : `${author.slug}/${safeTitle}`;
        if (options?.text && textSlug !== options.text) {
          continue;
        }

        this.logger.log(`📜 Starting work: ${textSlug}`);

        try {
          const workHtml = await this.readLocal(workPath, host);
          const $work = cheerio.load(workHtml);

          const frontmatterObject: Record<string, unknown> = {
            author: author.slug,
            text_metadata: {
              source_url: workPath,
            },
            title: work.title,
            type: workBook ? "text" : "book",
          };
          if (author.metadata) {
            frontmatterObject["author_metadata"] = { ...author.metadata };
            delete (
              frontmatterObject["author_metadata"] as Record<string, unknown>
            )["nickname"];
            delete (
              frontmatterObject["author_metadata"] as Record<string, unknown>
            )["sourceUrl"];
          }

          let markdown = `---\n${YAML.stringify(frontmatterObject)}---\n\n`;

          if (workBook) {
            markdown += `# ${workBook}\n\n`;
          }
          markdown += `## ${work.title}\n\n`;

          // Extract text primarily from <p> tags
          let $containers = $work("p");
          if ($containers.length < 2) {
            $containers =
              $work("div.page").length > 0 ? $work("div.page") : $work("body");
          }

          const paragraphs: string[] = [];
          $containers.each((_, p) => {
            const $p = $work(p);
            // Skip navigation and footer paragraphs
            if (
              $p.hasClass("pagehead") ||
              $p.hasClass("internal_navigation") ||
              $p.find("a").length > 3
            )
              return;

            let pText = $p.text().trim();
            pText = cleanBoilerplate(pText);
            if (pText.length === 0) return;

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
            let pendingNumber = "";

            for (let line of lines) {
              line = cleanBoilerplate(line);

              // Skip empty lines and English text
              if (!line || isEnglishBoilerplate(line)) continue;

              // Check if line is purely an isolated number
              const numberMatch =
                /^[[(*]*(\d+[a-zA-Z]*|[MDCLXVI]+)[\])*]*\.?$/.exec(line.trim());
              if (numberMatch && !line.includes(" ")) {
                pendingNumber = `**${numberMatch[1]}**`;
                continue;
              }

              // Merge isolated number into the current text line
              if (pendingNumber) {
                line = `${pendingNumber} ${line.trim()}`;
                pendingNumber = "";
              }

              line = formatLineNumber(line);

              paragraphs.push(line);
            }
          });

          if (!hasValidTextContent(paragraphs)) {
            this.logger.warn(`⚠️ Skipping empty or invalid text: ${textSlug}`);
            continue;
          }

          markdown += `${paragraphs.join("\n\n")}\n`;

          if ($containers.length < 2 && paragraphs.length < 2) {
            markdown +=
              "<!-- Scraper note: Very few <p> tags found, text might be structured differently -->\n\n";
          }

          const safeTitle = _.kebabCase(work.title);
          if (workBook) {
            const safeBook = _.kebabCase(workBook);
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

          currentText++;
          const textProgress = ` (${((currentText / totalTexts) * 100).toFixed(2)}%, ${currentText}/${totalTexts})`;
          this.logger.log(`📜 Completed work: ${textSlug}${textProgress}`);
        } catch (error) {
          this.logger.error(
            `❌ Failed to fetch work ${work.title}`,
            error instanceof Error ? error.stack : undefined,
          );
        }
      }
    }

    // Clean up temporary metadata used for processing
    for (const author of authors) {
      if (author.metadata) {
        delete author.metadata["nickname"];
        if (
          Object.keys(author.metadata).length === 1 &&
          author.metadata["sourceUrl"]
        ) {
          // keep sourceUrl
        }
      }
      for (const text of author.texts) {
        if (text.type === "book") {
          for (const child of text.childTexts) {
            if (child.metadata) delete child.metadata["book"];
          }
        } else if (text.metadata) {
          delete text.metadata["book"];
        }
      }
    }

    return authors;
  }
}
