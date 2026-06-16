import * as fs from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import * as cheerio from "cheerio";
import _ from "lodash";
import YAML from "yaml";

import { Author, Text } from "@monorepo/lexico-entities";

import { LoggerService } from "../../logger/logger.service";
import { formatLineNumber, hasValidTextContent } from "../library.utilities";

/**
 * Provider for ingesting CSEL (Corpus Scriptorum Ecclesiasticorum Latinorum) texts.
 */
@Injectable()
export class CorpusScriptorumEcclesiasticorumLatinorumLibraryProvider {
  constructor(private readonly logger: LoggerService) {}

  readonly name = "corpus-scriptorum-ecclesiasticorum-latinorum";

  private async appendCselText(
    author: Author,
    resolved: {
      authorSlug: string;
      metadata: Record<string, string>;
      rawTitle: string;
      relativeSourcePath: string;
      titleSlug: string;
    },
    $: cheerio.CheerioAPI,
    dataPath: string,
  ): Promise<boolean> {
    const { authorSlug, metadata, rawTitle, relativeSourcePath, titleSlug } =
      resolved;
    const textEntity = this.createCselTextEntity(
      rawTitle,
      titleSlug,
      metadata,
      relativeSourcePath,
    );
    author.texts.push(textEntity);
    const paragraphs = this.extractParagraphs($);
    const markdown = this.buildCselTextContent(
      rawTitle,
      authorSlug,
      metadata,
      relativeSourcePath,
      paragraphs,
    );
    if (!markdown) return false;
    const authorDirectory = path.join(dataPath, authorSlug);
    await fs.mkdir(authorDirectory, { recursive: true });
    await fs.writeFile(
      path.join(authorDirectory, `${titleSlug}.md`),
      markdown,
      "utf8",
    );
    return true;
  }

  private buildCselTextContent(
    rawTitle: string,
    authorSlug: string,
    metadata: Record<string, string>,
    relativeSourcePath: string,
    paragraphs: string[],
  ): null | string {
    if (!hasValidTextContent(paragraphs)) return null;
    const textMetadata = {
      ...metadata,
      source_url: `https://raw.githubusercontent.com/OpenGreekAndLatin/csel-dev/master/${relativeSourcePath}`,
    };
    const frontmatterObject: Record<string, unknown> = {
      author: authorSlug,
      title: rawTitle,
      type: "text",
    };
    if (Object.keys(textMetadata).length > 0) {
      frontmatterObject["text_metadata"] = textMetadata;
    }
    let markdown = `---\n${YAML.stringify(frontmatterObject)}---\n\n`;
    markdown += `# ${rawTitle}\n\n`;
    markdown += `${paragraphs.join("\n\n")}\n`;
    return markdown;
  }

  private checkTextFilter(
    options: undefined | { author?: string; text?: string },
    authorSlug: string,
    textSlug: string,
  ): boolean {
    if (options?.author && authorSlug !== options.author) return true;
    if (options?.text && textSlug !== options.text) return true;
    return false;
  }

  private async collectCselXmlPaths(
    sourceDataDirectory: string,
  ): Promise<null | string[]> {
    try {
      const allFiles = await fs.readdir(sourceDataDirectory, {
        recursive: true,
        withFileTypes: true,
      });
      return allFiles
        .filter((file) => file.isFile() && file.name.endsWith(".xml"))
        .map((file) => path.join(file.parentPath, file.name));
    } catch (error) {
      this.logger.error(
        `❌ Could not read source directory: ${String(error)}. Did you run the corpus-scriptorum-ecclesiasticorum-latinorum command first?`,
      );
      return null;
    }
  }

  private createCselTextEntity(
    rawTitle: string,
    titleSlug: string,
    metadata: Record<string, string>,
    relativeSourcePath: string,
  ): Text {
    const textEntity = new Text();
    textEntity.metadata = { ...metadata, sourceUrl: relativeSourcePath };
    textEntity.title = rawTitle;
    textEntity.slug = titleSlug;
    textEntity.type = "text";
    return textEntity;
  }

  private extractParagraphs($: cheerio.CheerioAPI): string[] {
    const paragraphs: string[] = [];
    $("body")
      .find("p, l, div[type='textpart']")
      .each((_, element) => {
        const $element = $(element);
        if ($element[0]?.name === "div" && $element.find("p, l").length > 0) {
          return;
        }

        const $clone = $element.clone();
        $clone.find("note, app, rdg, lem").remove();

        let text = $clone.text().trim();
        if (!text) return;

        text = text.replaceAll(/\s+/g, " ");

        const nAttribute = $element.attr("n");
        if (nAttribute) {
          text = `**${nAttribute}** ${text}`;
        }

        text = formatLineNumber(text);
        paragraphs.push(text);
      });
    return paragraphs;
  }

  private getMetadata($: cheerio.CheerioAPI): Record<string, string> {
    const metadata: Record<string, string> = {};
    const editors = $("titleStmt editor")
      .map((_, element) => $(element).text().trim())
      .get();
    if (editors.length > 0) metadata["editors"] = editors.join(", ");

    const publisher =
      $("sourceDesc biblStruct publisher").first().text().trim() ||
      $("sourceDesc publisher").first().text().trim();
    if (publisher) metadata["publisher"] = publisher;

    const printDate =
      $("sourceDesc biblStruct date").first().text().trim() ||
      $("sourceDesc date").first().text().trim();
    if (printDate) metadata["print_publication_date"] = printDate;

    return metadata;
  }

  private getOrCreateAuthor(
    authorsMap: Map<string, Author>,
    authorSlug: string,
    rawAuthor: string,
    relativeSourcePath: string,
  ): Author {
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

  private async processFile(
    xmlPath: string,
    options: undefined | { author?: string; text?: string },
    authorsMap: Map<string, Author>,
    sourceDataDirectory: string,
    dataPath: string,
    index: number,
    totalFiles: number,
  ): Promise<void> {
    this.logger.log(`📜 Starting processing: ${xmlPath}`);
    try {
      const xmlContent = await fs.readFile(xmlPath, "utf8");
      const $ = cheerio.load(xmlContent, { xml: true });
      const resolved = this.resolveXmlMetadata(
        $,
        xmlPath,
        options,
        sourceDataDirectory,
      );
      if (!resolved) return;
      const { authorSlug, rawAuthor, relativeSourcePath } = resolved;
      const author = this.getOrCreateAuthor(
        authorsMap,
        authorSlug,
        rawAuthor,
        relativeSourcePath,
      );
      const appended = await this.appendCselText(author, resolved, $, dataPath);
      if (!appended) {
        this.logger.warn(
          `⚠️ Skipping empty or invalid text: ${resolved.textSlug}`,
        );
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
      const progressString = ` (${(((index + 1) / totalFiles) * 100).toFixed(2)}%, ${index + 1}/${totalFiles})`;
      this.logger.log(`📜 Completed processing: ${xmlPath}${progressString}`);
    } catch (error) {
      this.logger.warn(`⚠️ Error processing ${xmlPath}: ${error}`);
    }
  }

  private resolveXmlMetadata(
    $: cheerio.CheerioAPI,
    xmlPath: string,
    options: undefined | { author?: string; text?: string },
    sourceDataDirectory: string,
  ): null | {
    authorSlug: string;
    metadata: Record<string, string>;
    rawAuthor: string;
    rawTitle: string;
    relativeSourcePath: string;
    textSlug: string;
    titleSlug: string;
  } {
    const rawAuthor =
      $("titleStmt author").first().text().trim() || "Unknown Author";
    const rawTitle =
      $("titleStmt title").first().text().trim() || "Unknown Title";
    if (!rawAuthor || !rawTitle) return null;
    const metadata = this.getMetadata($);
    const authorSlug = _.kebabCase(rawAuthor);
    const titleSlug = _.kebabCase(rawTitle);
    const textSlug = `${authorSlug}/${titleSlug}`;
    if (this.checkTextFilter(options, authorSlug, textSlug)) return null;
    const relativeSourcePath = path.relative(sourceDataDirectory, xmlPath);
    return {
      authorSlug,
      metadata,
      rawAuthor,
      rawTitle,
      relativeSourcePath,
      textSlug,
      titleSlug,
    };
  }

  /**
   * Fetch authors, works, and output markdown files to the data directory.
   */
  async ingest(options?: {
    author?: string;
    text?: string;
  }): Promise<Author[]> {
    this.logger.log(`🗂️ Ingesting CSEL from local data`);

    const sourceDataDirectory = path.resolve(
      "data",
      "corpus-scriptorum-ecclesiasticorum-latinorum-source",
    );

    const xmlPaths = await this.collectCselXmlPaths(sourceDataDirectory);
    if (!xmlPaths) return [];

    this.logger.log(
      `🗂️ Found ${xmlPaths.length} Latin XML files in local CSEL cache`,
    );

    const dataPath = path.resolve("data", "library", this.name);
    await fs.mkdir(dataPath, { recursive: true });

    const authorsMap = new Map<string, Author>();

    for (let index = 0; index < xmlPaths.length; index++) {
      const xmlPath = xmlPaths[index];
      if (!xmlPath) continue;

      await this.processFile(
        xmlPath,
        options,
        authorsMap,
        sourceDataDirectory,
        dataPath,
        index,
        xmlPaths.length,
      );
    }

    return [...authorsMap.values()];
  }
}
