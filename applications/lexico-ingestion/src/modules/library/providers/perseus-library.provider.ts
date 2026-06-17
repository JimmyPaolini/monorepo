import * as fs from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import * as cheerio from "cheerio";
import _ from "lodash";
import YAML from "yaml";

import { Author, Text } from "@monorepo/lexico-entities";

import { LoggerService } from "../../logger/logger.service";
import { formatLineNumber, hasValidTextContent } from "../library.utilities";

import type { AnyNode } from "domhandler";

/**
 * Provider for ingesting Perseus DL Latin texts.
 */
@Injectable()
export class PerseusLibraryProvider {
  constructor(private readonly logger: LoggerService) {}

  readonly name = "perseus";

  private addPerseusTextEntity(args: {
    author: Author;
    metadata: Record<string, unknown>;
    rawTitle: string;
    relativeSourcePath: string;
    titleSlug: string;
  }): void {
    const { author, metadata, rawTitle, relativeSourcePath, titleSlug } = args;
    const textEntity = new Text();
    textEntity.metadata = { ...metadata, sourceUrl: relativeSourcePath };
    textEntity.title = rawTitle;
    textEntity.slug = titleSlug;
    textEntity.type = "text";
    author.texts.push(textEntity);
  }

  // 🔏 Private Methods

  private collectParagraphsFromElements(
    elements: cheerio.Cheerio<AnyNode>,
    $: cheerio.CheerioAPI,
  ): string[] {
    const paragraphs: string[] = [];
    elements.each((_index: number, pElement: unknown) => {
      const $clone = $(pElement as string).clone();
      $clone.find("note, app, rdg, lem, sic, orig, abbr").remove();
      let text = $clone.text().trim();
      if (!text) {
        return;
      }
      const nAttribute = $(pElement as string).attr("n");
      if (nAttribute) {
        text = `**${nAttribute}** ${text}`;
      }
      text = formatLineNumber(text);
      text = text.replaceAll(/\s+/g, " ");
      paragraphs.push(text);
    });
    return paragraphs;
  }

  private async collectSourceXmlPaths(
    sourceDataDirectory: string,
  ): Promise<string[]> {
    try {
      const allFiles = await fs.readdir(sourceDataDirectory, {
        recursive: true,
        withFileTypes: true,
      });
      const xmlPaths = allFiles
        .filter((f) => f.isFile() && f.name.endsWith(".xml"))
        .map((f) => path.join(f.parentPath, f.name));
      this.logger.log(
        `🗂️ Found ${xmlPaths.length} Latin XML files in local Perseus cache`,
      );
      return xmlPaths;
    } catch (error) {
      this.logger.error(
        `❌ Could not read source directory: ${String(error)}. Did you run the perseus command first?`,
      );
      return [];
    }
  }

  private extractPerseusMetadata(
    $: cheerio.CheerioAPI,
    relativeSourcePath: string,
  ): Record<string, unknown> {
    const metadata: Record<string, unknown> = {};
    const editors = $("titleStmt editor")
      .map((_index, element) => $(element).text().trim())
      .get();
    if (editors.length > 0) {
      metadata["editors"] = editors;
    }
    const publisher =
      $("sourceDesc biblStruct publisher").first().text().trim() ||
      $("sourceDesc publisher").first().text().trim();
    if (publisher) {
      metadata["publisher"] = publisher;
    }
    const printDate =
      $("sourceDesc biblStruct date").first().text().trim() ||
      $("sourceDesc date").first().text().trim();
    if (printDate) {
      metadata["print_publication_date"] = printDate;
    }
    const urnMatch = /(phi\d+\.phi\d+\.perseus-lat\d+)/.exec(
      relativeSourcePath,
    );
    if (urnMatch) {
      metadata["cts_urn"] = `urn:cts:latinLit:${urnMatch[1]}`;
    }
    return metadata;
  }

  private extractTextNodes(args: {
    $: cheerio.CheerioAPI;
    $element: cheerio.Cheerio<AnyNode>;
    currentPath: string[];
    currentTitle: string;
    filesToWrite: { content: string; relativePath: string; title: string }[];
    rawTitle: string;
  }): void {
    const { $, $element, currentPath, currentTitle, filesToWrite, rawTitle } =
      args;
    const children = $element.children("div[type='textpart']");
    if (children.length > 0) {
      this.processTextPartChildren({
        $,
        $element,
        children,
        currentPath,
        currentTitle,
        filesToWrite,
        rawTitle,
      });
    } else {
      this.processLeafTextPart({
        $,
        $element,
        currentPath,
        currentTitle,
        filesToWrite,
        rawTitle,
      });
    }
  }

  private getOrCreatePerseusAuthor(args: {
    authorSlug: string;
    authorsMap: Map<string, Author>;
    rawAuthor: string;
    relativeSourcePath: string;
  }): Author {
    const { authorSlug, authorsMap, rawAuthor, relativeSourcePath } = args;
    let author = authorsMap.get(authorSlug);
    if (!author) {
      author = new Author();
      author.name = rawAuthor;
      author.metadata = { sourceUrl: relativeSourcePath };
      author.slug = authorSlug;
      author.texts = [];
      authorsMap.set(authorSlug, author);
    }
    return author;
  }

  private isFilteredOut(
    rawAuthor: string,
    rawTitle: string,
    options?: { author?: string; text?: string },
  ): boolean {
    const authorSlug = _.kebabCase(rawAuthor);
    const titleSlug = _.kebabCase(rawTitle);
    const textSlug = `${authorSlug}/${titleSlug}`;
    if (options?.author && authorSlug !== options.author) {
      return true;
    }
    if (options?.text && textSlug !== options.text) {
      return true;
    }
    return false;
  }

  private async loadSourceXmlFile(args: { xmlPath: string }): Promise<{
    $: cheerio.CheerioAPI;
    rawAuthor: string;
    rawTitle: string;
  }> {
    const { xmlPath } = args;
    return fs.readFile(xmlPath, "utf8").then((xmlContent) => {
      const $ = cheerio.load(xmlContent, { xml: true });
      const rawAuthor = $("titleStmt author").first().text().trim();
      const rawTitle = $("titleStmt title").first().text().trim();
      return { $, rawAuthor, rawTitle };
    });
  }

  private processLeafTextPart(args: {
    $: cheerio.CheerioAPI;
    $element: cheerio.Cheerio<AnyNode>;
    currentPath: string[];
    currentTitle: string;
    filesToWrite: { content: string; relativePath: string; title: string }[];
    rawTitle: string;
  }): void {
    const { $, $element, currentPath, currentTitle, filesToWrite, rawTitle } =
      args;
    const paragraphs = this.collectParagraphsFromElements(
      $element.find("p, l"),
      $,
    );
    if (paragraphs.length === 0) {
      const $clone = $element.clone();
      $clone.find("note, app, rdg, lem, sic, orig, abbr").remove();
      let text = $clone.text().trim();
      if (text) {
        const formatted = formatLineNumber(text);
        text = formatted.replaceAll(/\s+/g, " ");
        paragraphs.push(text);
      }
    }
    if (paragraphs.length > 0 && hasValidTextContent(paragraphs)) {
      const fileTitle = currentPath.length > 1 ? currentTitle : rawTitle;
      filesToWrite.push({
        content: paragraphs.join("\n\n"),
        relativePath: `${currentPath.join("/")}.md`,
        title: fileTitle,
      });
    }
  }

  private async processPerseusFile(args: {
    authorsMap: Map<string, Author>;
    dataPath: string;
    index: number;
    options?: { author?: string; text?: string };
    sourceDataDirectory: string;
    total: number;
    xmlPath: string;
  }): Promise<void> {
    const {
      authorsMap,
      dataPath,
      index,
      options,
      sourceDataDirectory,
      total,
      xmlPath,
    } = args;
    this.logger.log(`📜 Starting processing: ${xmlPath}`);
    try {
      await this.processSourceXmlFile({
        authorsMap,
        dataPath,
        sourceDataDirectory,
        xmlPath,
        ...(options ? { options } : {}),
      });
      const progress = ` (${(((index + 1) / total) * 100).toFixed(2)}%, ${index + 1}/${total})`;
      this.logger.log(`📜 Completed processing: ${xmlPath}${progress}`);
    } catch (error) {
      this.logger.warn(`⚠️ Error processing ${xmlPath}: ${error}`);
    }
  }

  private async processSourceXmlFile(args: {
    authorsMap: Map<string, Author>;
    dataPath: string;
    options?: { author?: string; text?: string };
    sourceDataDirectory: string;
    xmlPath: string;
  }): Promise<void> {
    const { authorsMap, dataPath, options, sourceDataDirectory, xmlPath } =
      args;
    const { $, rawAuthor, rawTitle } = await this.loadSourceXmlFile({
      xmlPath,
    });
    if (!rawAuthor || !rawTitle) {
      this.logger.warn(`⚠️ Missing metadata in ${xmlPath}`);
      return;
    }
    if (this.isFilteredOut(rawAuthor, rawTitle, options)) {
      return;
    }
    const relativeSourcePath = path.relative(sourceDataDirectory, xmlPath);
    const authorSlug = _.kebabCase(rawAuthor);
    const titleSlug = _.kebabCase(rawTitle);
    const metadata = this.extractPerseusMetadata($, relativeSourcePath);
    const author = this.getOrCreatePerseusAuthor({
      authorSlug,
      authorsMap,
      rawAuthor,
      relativeSourcePath,
    });
    await this.writeSourceTextForAuthor({
      $,
      author,
      authorSlug,
      dataPath,
      metadata,
      rawTitle,
      relativeSourcePath,
      titleSlug,
    });
  }

  private processTextPartChildren(args: {
    $: cheerio.CheerioAPI;
    $element: cheerio.Cheerio<AnyNode>;
    children: cheerio.Cheerio<AnyNode>;
    currentPath: string[];
    currentTitle: string;
    filesToWrite: { content: string; relativePath: string; title: string }[];
    rawTitle: string;
  }): void {
    const {
      $,
      $element,
      children,
      currentPath,
      currentTitle,
      filesToWrite,
      rawTitle,
    } = args;
    const skipKeywords = [
      "front",
      "preface",
      "introduction",
      "cast",
      "subject",
      "index",
    ];
    children.each((_index: number, child: unknown) => {
      const $child = $(child as string);
      const subtype = $child.attr("subtype") || "section";
      const n = $child.attr("n") || "";
      if (
        skipKeywords.some(
          (kw) =>
            subtype.toLowerCase().includes(kw) || n.toLowerCase().includes(kw),
        )
      ) {
        return;
      }
      const partName = _.kebabCase(n ? `${subtype} ${n}` : subtype);
      const partTitle = n
        ? `${_.startCase(subtype)} ${n}`
        : _.startCase(subtype);
      this.extractTextNodes({
        $,
        $element: $child,
        currentPath: [...currentPath, partName],
        currentTitle: partTitle,
        filesToWrite,
        rawTitle,
      });
    });
    const directParagraphs = this.collectParagraphsFromElements(
      $element.children("p, l"),
      $,
    );
    if (directParagraphs.length > 0 && hasValidTextContent(directParagraphs)) {
      const fileTitle = currentPath.length > 1 ? currentTitle : rawTitle;
      filesToWrite.push({
        content: directParagraphs.join("\n\n"),
        relativePath: [...currentPath, "index.md"].join("/"),
        title: fileTitle,
      });
    }
  }

  private async writeSourceMarkdownFiles(args: {
    $: cheerio.CheerioAPI;
    authorSlug: string;
    dataPath: string;
    metadata: Record<string, unknown>;
    rawTitle: string;
    relativeSourcePath: string;
    titleSlug: string;
  }): Promise<void> {
    const {
      $,
      authorSlug,
      dataPath,
      metadata,
      rawTitle,
      relativeSourcePath,
      titleSlug,
    } = args;
    const frontmatterObject: Record<string, unknown> = {
      author: authorSlug,
      type: "text",
    };
    const textMetadata = {
      ...metadata,
      source_url: `https://raw.githubusercontent.com/PerseusDL/canonical-latinLit/master/${relativeSourcePath}`,
    };
    if (Object.keys(textMetadata).length > 0) {
      frontmatterObject["text_metadata"] = textMetadata;
    }
    const filesToWrite: {
      content: string;
      relativePath: string;
      title: string;
    }[] = [];
    this.extractTextNodes({
      $,
      $element: $("body"),
      currentPath: [titleSlug],
      currentTitle: rawTitle,
      filesToWrite,
      rawTitle,
    });
    const authorDirectory = path.join(dataPath, authorSlug);
    await this.writeTextFiles(filesToWrite, authorDirectory, frontmatterObject);
    await new Promise((resolve) => {
      setTimeout(resolve, 100);
    });
  }

  private async writeSourceTextForAuthor(args: {
    $: cheerio.CheerioAPI;
    author: Author;
    authorSlug: string;
    dataPath: string;
    metadata: Record<string, unknown>;
    rawTitle: string;
    relativeSourcePath: string;
    titleSlug: string;
  }): Promise<void> {
    const {
      $,
      author,
      authorSlug,
      dataPath,
      metadata,
      rawTitle,
      relativeSourcePath,
      titleSlug,
    } = args;
    this.addPerseusTextEntity({
      author,
      metadata,
      rawTitle,
      relativeSourcePath,
      titleSlug,
    });
    await this.writeSourceMarkdownFiles({
      $,
      authorSlug,
      dataPath,
      metadata,
      rawTitle,
      relativeSourcePath,
      titleSlug,
    });
  }

  private async writeTextFiles(
    filesToWrite: { content: string; relativePath: string; title: string }[],
    authorDirectory: string,
    frontmatterObject: Record<string, unknown>,
  ): Promise<void> {
    for (const file of filesToWrite) {
      const fm = { ...frontmatterObject, title: file.title };
      let markdown = `---\n${YAML.stringify(fm)}---\n\n`;
      markdown += `# ${file.title}\n\n`;
      markdown += `${file.content}\n`;
      const fullPath = path.join(authorDirectory, file.relativePath);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, markdown, "utf8");
    }
  }

  /**
   * Fetch authors, works, and output markdown files to the data directory.
   */
  async ingest(options?: {
    author?: string;
    text?: string;
  }): Promise<Author[]> {
    this.logger.log(`🗂️ Ingesting Perseus from local data`);
    const sourceDataDirectory = path.resolve("data", "perseus-source");
    const xmlPaths = await this.collectSourceXmlPaths(sourceDataDirectory);
    if (xmlPaths.length === 0) {
      return [];
    }
    const dataPath = path.resolve("data", "library", this.name);
    await fs.mkdir(dataPath, { recursive: true });
    const authorsMap = new Map<string, Author>();
    for (let index = 0; index < xmlPaths.length; index++) {
      const xmlPath = xmlPaths[index];
      if (!xmlPath) {
        continue;
      }
      await this.processPerseusFile({
        authorsMap,
        dataPath,
        index,
        sourceDataDirectory,
        total: xmlPaths.length,
        xmlPath,
        ...(options ? { options } : {}),
      });
    }
    return [...authorsMap.values()];
  }
}
