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

import type { AnyNode } from "domhandler";

/**
 * Provider for scraping The Latin Library.
 */
@Injectable()
export class LatinLibraryProvider {
  constructor(private readonly logger: LoggerService) {}

  readonly name = "thelatinlibrary";

  private addFallbackText(author: Author, authorUrlObject: URL): void {
    const fallback = new Text();
    fallback.title = author.metadata?.["nickname"] as string;
    fallback.slug = _.kebabCase(fallback.title);
    fallback.type = "text";
    fallback.metadata = { sourceUrl: authorUrlObject.href };
    author.texts = [fallback];
  }

  // 🔏 Private Methods

  private addTextToBook(
    textEntity: Text,
    book: string,
    author: Author,
    booksMap: Map<string, Text>,
  ): void {
    if (!textEntity.metadata) {
      textEntity.metadata = {};
    }
    textEntity.metadata["book"] = book;
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
    bookText.childTexts.push(textEntity);
  }

  private buildCategoryAuthor(
    anchorElement: AnyNode,
    $cat: cheerio.CheerioAPI,
  ): Author | null {
    const $a = $cat(anchorElement);
    const nickname = $a.text().replace(/\s/, " ").trim().toLowerCase();
    if (!nickname) {
      return null;
    }
    const slug = _.kebabCase(nickname);
    const name = authorIdToName[slug] || nickname;
    let href = $a.attr("href")?.trim() ?? "";
    const invalidPaths = ["index.html", "classics.html"];
    if (!href || invalidPaths.some((part) => href.includes(part))) {
      return null;
    }
    if (href.startsWith("/")) {
      href = href.slice(1);
    }
    return this.makeAuthor(name, slug, { nickname, sourceUrl: href });
  }

  private buildRootAuthors(html: string): Author[] {
    const $ = cheerio.load(html);
    cheerioTableParser($);
    const authors: Author[] = [];
    $("p>table")
      .first()
      .find("a")
      .each((_index, a) => {
        const $a = $(a);
        const nickname = $a.text().replace(/\s/, " ").trim().toLowerCase();
        const slug = _.kebabCase(nickname);
        const name = authorIdToName[slug] || nickname;
        const href = $a.attr("href")?.trim() ?? "";
        if (!href || href.includes("index.html")) {
          return;
        }
        authors.push(
          this.makeAuthor(name, slug, { nickname, sourceUrl: href }),
        );
      });
    return authors;
  }

  private buildTextEntityForLink(
    anchor: AnyNode,
    $: cheerio.CheerioAPI,
    absoluteUrl: string,
  ): Text {
    const rawTitle = $(anchor).text().trim().toLowerCase();
    const title = rawTitle ? _.startCase(rawTitle) : "";
    const textEntity = new Text();
    textEntity.type = "text";
    textEntity.title = title;
    textEntity.slug = _.kebabCase(title);
    textEntity.metadata = { sourceUrl: absoluteUrl };
    return textEntity;
  }

  private buildWorkFrontmatter(
    work: Text,
    author: Author,
    workBook: string | undefined,
  ): Record<string, unknown> {
    const frontmatter: Record<string, unknown> = {
      author: author.slug,
      text_metadata: { source_url: work.metadata?.["sourceUrl"] as string },
      title: work.title,
      type: workBook ? "text" : "book",
    };
    if (author.metadata) {
      const authorMeta = { ...author.metadata } as Record<string, unknown>;
      delete authorMeta["nickname"];
      delete authorMeta["sourceUrl"];
      frontmatter["author_metadata"] = authorMeta;
    }
    return frontmatter;
  }

  private buildWorkMarkdownContent(
    work: Text,
    author: Author,
    workBook: string | undefined,
    paragraphs: string[],
    $work: cheerio.CheerioAPI,
  ): string {
    const frontmatter = this.buildWorkFrontmatter(work, author, workBook);
    let markdown = `---\n${YAML.stringify(frontmatter)}---\n\n`;
    if (workBook) {
      markdown += `# ${workBook}\n\n`;
    }
    markdown += `## ${work.title}\n\n`;
    markdown += `${paragraphs.join("\n\n")}\n`;
    if ($work("p").length < 2 && paragraphs.length < 2) {
      markdown +=
        "<!-- Scraper note: Very few <p> tags found, text might be structured differently -->\n\n";
    }
    return markdown;
  }

  private cleanupAuthorMetadata(author: Author): void {
    if (author.metadata) {
      delete author.metadata["nickname"];
    }
    for (const text of author.texts) {
      if (text.type === "book") {
        text.childTexts.forEach((child) => {
          if (child.metadata) {
            delete child.metadata["book"];
          }
        });
      } else if (text.metadata) {
        delete text.metadata["book"];
      }
    }
  }

  private collectAuthorTexts(
    author: Author,
    $: cheerio.CheerioAPI,
    authorUrlObject: URL,
  ): void {
    const booksMap = new Map<string, Text>();
    for (const anchor of $("a").get()) {
      this.processTextLink(anchor, $, authorUrlObject, author, booksMap);
    }
    if (author.texts.length === 0) {
      this.addFallbackText(author, authorUrlObject);
    }
  }

  private computeYear(
    yearString: string | undefined,
    eraString: string,
  ): number {
    const year = Number.parseInt(yearString ?? "0", 10);
    return eraString.toUpperCase().includes("B") ? -year : year;
  }

  private async expandCategoryAuthors(
    rootAuthors: Author[],
    host: string,
  ): Promise<Author[]> {
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
      if (!categoryHrefs.has(href)) {
        authors.push(author);
        continue;
      }
      const catHtml = await this.readLocal(new URL(href, host).href, host);
      const $cat = cheerio.load(catHtml);
      $cat("table a").each((_index, a) => {
        const result = this.buildCategoryAuthor(a, $cat);
        if (result) {
          authors.push(result);
        }
      });
    }
    return authors;
  }

  private extractAuthorDates(h2Text: string): Record<string, number> {
    const dateMatch =
      /(\d+)\s*(B\.?C\.?|A\.?D\.?)?\s*[-\u2013]\s*(?:c\.\s*)?(\d+)\s*(B\.?C\.?|A\.?D\.?)?/i.exec(
        h2Text,
      );
    if (!dateMatch) {
      return {};
    }
    const startEra =
      dateMatch[2] ||
      (dateMatch[4]?.toUpperCase().includes("B") ? "B.C." : "A.D.");
    const endEra = dateMatch[4] || "A.D.";
    return {
      birth_year: this.computeYear(dateMatch[1], startEra),
      death_year: this.computeYear(dateMatch[3], endEra),
    };
  }

  private extractAuthorPageMetadata(
    $: cheerio.CheerioAPI,
    authorName: string,
  ): Record<string, unknown> {
    const h1Text =
      $("h1.pagehead").text().trim() || $("h1").first().text().trim();
    const h2Text = $("h2.date").text().trim() || $("h2").first().text().trim();
    const metadata: Record<string, unknown> = {};
    if (
      h1Text &&
      h1Text.toLowerCase() !== authorName.toLowerCase() &&
      !h1Text.includes("Pagina amissa")
    ) {
      metadata["full_name"] = h1Text;
    }
    const dates = this.extractAuthorDates(h2Text);
    return { ...metadata, ...dates };
  }

  private extractLinesFromParagraph(
    paragraphElement: AnyNode,
    $work: cheerio.CheerioAPI,
  ): string[] {
    const $paragraph = $work(paragraphElement);
    if (
      $paragraph.hasClass("pagehead") ||
      $paragraph.hasClass("internal_navigation") ||
      $paragraph.find("a").length > 3
    ) {
      return [];
    }
    const pText = cleanBoilerplate($paragraph.text().trim());
    if (pText.length === 0) {
      return [];
    }
    const paraHtml = $paragraph.html() ?? "";
    const paraText = this.parseParagraphHtml(paraHtml);
    return this.extractParagraphLines(paraText);
  }

  private extractParagraphLines(paraText: string): string[] {
    const lines = paraText.split("\n");
    const result: string[] = [];
    let pendingNumber = "";
    for (let line of lines) {
      line = cleanBoilerplate(line);
      if (!line || isEnglishBoilerplate(line)) {
        continue;
      }
      const numberMatch = /^[[(*]*(\d+[a-zA-Z]*|[MDCLXVI]+)[\])*]*\.?$/.exec(
        line.trim(),
      );
      if (numberMatch && !line.includes(" ")) {
        pendingNumber = `**${numberMatch[1]}**`;
        continue;
      }
      if (pendingNumber) {
        line = `${pendingNumber} ${line.trim()}`;
        pendingNumber = "";
      }
      result.push(formatLineNumber(line));
    }
    return result;
  }

  private findRawBookHeading(
    anchorElement: AnyNode,
    $: cheerio.CheerioAPI,
  ): string {
    const $anchor = $(anchorElement);
    let rawBook = $anchor
      .closest("div")
      .prev(":header")
      .text()
      .trim()
      .toLowerCase();
    if (!rawBook) {
      const parentTable = $anchor.closest("table");
      if (parentTable.length > 0) {
        const outerTable = parentTable.parents("table").last();
        const tableToCheck = outerTable.length > 0 ? outerTable : parentTable;
        let previous = tableToCheck.prev();
        while (previous.length > 0 && !previous.text().trim()) {
          previous = previous.prev();
        }
        if (previous.length > 0) {
          rawBook = previous.text().trim().toLowerCase();
        }
      }
    }
    return rawBook;
  }

  private getTextSlug(work: Text, author: Author): string {
    const workBook = work.metadata?.["book"] as string | undefined;
    const safeTitle = _.kebabCase(work.title);
    return workBook
      ? `${author.slug}/${_.kebabCase(workBook)}/${safeTitle}`
      : `${author.slug}/${safeTitle}`;
  }

  private isExternalOrSelfLink(
    absoluteUrl: string,
    authorUrlObject: URL,
  ): boolean {
    const parsedUrl = new URL(absoluteUrl);
    return (
      parsedUrl.hostname !== "www.thelatinlibrary.com" ||
      parsedUrl.pathname === authorUrlObject.pathname
    );
  }

  private isSkippedHref(href: string): boolean {
    const skippedPaths = [
      "index.html",
      "classics.html",
      "medieval.html",
      "neo.html",
      "christian.html",
      "misc.html",
      "ius.html",
    ];
    return skippedPaths.some((part) => href.includes(part));
  }

  private isTextFileHref(href: string): boolean {
    const lower = href.toLowerCase();
    return (
      lower.endsWith(".html") ||
      lower.endsWith(".htm") ||
      lower.endsWith(".shtml")
    );
  }

  private makeAuthor(
    name: string,
    slug: string,
    metadata: Record<string, unknown>,
  ): Author {
    const author = new Author();
    author.name = name;
    author.slug = slug;
    author.metadata = metadata;
    author.texts = [];
    return author;
  }

  private parseParagraphHtml(paraHtml: string): string {
    const processedHtml = paraHtml.replaceAll(/<br\s*\/?>/gi, "\n");
    const $ = cheerio.load(processedHtml);
    let text = "";
    $("body")
      .contents()
      .each((_, node) => {
        if ((node.type as string) === "text") {
          text += $(node).text();
        } else if (
          (node.type as string) === "tag" &&
          "name" in node &&
          node.name === "b"
        ) {
          const boldText = $(node).text().trim();
          if (boldText) {
            text += `**${boldText}** `;
          }
        } else if ((node.type as string) === "tag") {
          text += $(node).text();
        }
      });
    return text;
  }

  private parseWorkParagraphs($work: cheerio.CheerioAPI): string[] {
    let $containers = $work("p");
    if ($containers.length < 2) {
      $containers =
        $work("div.page").length > 0 ? $work("div.page") : $work("body");
    }
    const paragraphs: string[] = [];
    $containers.each((_, paragraphElement) => {
      const lines = this.extractLinesFromParagraph(paragraphElement, $work);
      paragraphs.push(...lines);
    });
    return paragraphs;
  }

  private async processAuthorPage(author: Author, host: string): Promise<void> {
    const nickname = author.metadata?.["nickname"] as string;
    const authorPath = author.metadata?.["sourceUrl"] as string;
    this.logger.log(`👤 Starting author metadata: ${nickname}`);
    const authorUrlObject = new URL(authorPath, host);
    const authorText = await this.readLocal(authorUrlObject.href, host);
    const $ = cheerio.load(authorText);
    const additionalMetadata = this.extractAuthorPageMetadata($, author.name);
    if (Object.keys(additionalMetadata).length > 0) {
      author.metadata = { ...author.metadata, ...additionalMetadata };
    }
    this.collectAuthorTexts(author, $, authorUrlObject);
    this.logger.log(`👤 Completed author metadata: ${nickname}`);
  }

  private processTextLink(
    anchor: AnyNode,
    $: cheerio.CheerioAPI,
    authorUrlObject: URL,
    author: Author,
    booksMap: Map<string, Text>,
  ): void {
    const href = $(anchor).attr("href")?.trim();
    if (!href || this.isSkippedHref(href) || !this.isTextFileHref(href)) {
      return;
    }
    const absoluteUrl = new URL(href, authorUrlObject.href).href;
    if (this.isExternalOrSelfLink(absoluteUrl, authorUrlObject)) {
      return;
    }
    const rawBook = this.findRawBookHeading(anchor, $);
    const book = rawBook ? _.startCase(rawBook) : undefined;
    const textEntity = this.buildTextEntityForLink(anchor, $, absoluteUrl);
    if (book === undefined) {
      author.texts.push(textEntity);
    } else {
      this.addTextToBook(textEntity, book, author, booksMap);
    }
  }

  private async processWork(
    work: Text,
    author: Author,
    authorPath: string,
    host: string,
    textFilter: string | undefined,
    index: number,
    total: number,
  ): Promise<void> {
    const textSlug = this.getTextSlug(work, author);
    if (textFilter && textSlug !== textFilter) {
      return;
    }
    this.logger.log(`📜 Starting work: ${textSlug}`);
    try {
      const written = await this.writeWorkMarkdown(
        work,
        author,
        authorPath,
        host,
      );
      if (!written) {
        return;
      }
      const progress = ` (${(((index + 1) / total) * 100).toFixed(2)}%, ${index + 1}/${total})`;
      this.logger.log(`📜 Completed work: ${textSlug}${progress}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to fetch work ${work.title}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private async readLocal(urlString: string, host: string): Promise<string> {
    const parsed = new URL(urlString, host);
    let relative = parsed.pathname;
    if (relative.startsWith("/")) relative = relative.slice(1);
    if (!relative) relative = "index.html";
    if (relative.endsWith("/")) relative += "index.html";
    const targetPath = path.resolve("data", "latin-library-source", relative);
    return fs.readFile(targetPath, "utf8");
  }

  private async saveWorkMarkdown(
    markdown: string,
    authorPath: string,
    work: Text,
    workBook: string | undefined,
  ): Promise<void> {
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
  }

  private async writeAuthorMarkdown(
    author: Author,
    dataPath: string,
    host: string,
    options?: { author?: string; text?: string },
  ): Promise<void> {
    if (options?.author && author.slug !== options.author) {
      return;
    }
    const authorPath = path.join(dataPath, author.slug);
    await fs.mkdir(authorPath, { recursive: true });
    const allTextNodes = author.texts.flatMap((text) =>
      text.type === "book" ? text.childTexts : [text],
    );
    const total = allTextNodes.length;
    for (const [index, work] of allTextNodes.entries()) {
      await this.processWork(
        work,
        author,
        authorPath,
        host,
        options?.text,
        index,
        total,
      );
    }
  }

  private async writeWorkMarkdown(
    work: Text,
    author: Author,
    authorPath: string,
    host: string,
  ): Promise<boolean> {
    const workBook = work.metadata?.["book"] as string | undefined;
    const workPath = work.metadata?.["sourceUrl"] as string;
    const workHtml = await this.readLocal(workPath, host);
    const $work = cheerio.load(workHtml);
    const paragraphs = this.parseWorkParagraphs($work);
    if (!hasValidTextContent(paragraphs)) {
      this.logger.warn(`⚠️ Skipping empty or invalid text: ${work.slug}`);
      return false;
    }
    const markdown = this.buildWorkMarkdownContent(
      work,
      author,
      workBook,
      paragraphs,
      $work,
    );
    await this.saveWorkMarkdown(markdown, authorPath, work, workBook);
    return true;
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
    const indexHtml = await this.readLocal(host, host);
    const rootAuthors = this.buildRootAuthors(indexHtml);
    const authors = await this.expandCategoryAuthors(rootAuthors, host);
    authors.sort((a, b) =>
      ((a.metadata?.["nickname"] as string) || "").localeCompare(
        (b.metadata?.["nickname"] as string) || "",
      ),
    );
    const authorsToProcess = options?.author
      ? authors.filter((a) => a.slug === options.author)
      : authors;
    for (const author of authorsToProcess) {
      await this.processAuthorPage(author, host);
    }
    const dataPath = path.resolve("data", "library", this.name);
    await fs.mkdir(dataPath, { recursive: true });
    for (const author of authors) {
      await this.writeAuthorMarkdown(author, dataPath, host, options);
    }
    authors.forEach((author) => this.cleanupAuthorMetadata(author));
    return authors;
  }
}
