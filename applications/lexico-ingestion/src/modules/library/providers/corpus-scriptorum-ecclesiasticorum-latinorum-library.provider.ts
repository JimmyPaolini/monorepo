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

  private getMetadata($: cheerio.CheerioAPI): Record<string, unknown> {
    const metadata: Record<string, unknown> = {};
    const editors = $("titleStmt editor")
      .map((_, element) => $(element).text().trim())
      .get();
    if (editors.length > 0) metadata["editors"] = editors;

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

      const rawAuthor =
        $("titleStmt author").first().text().trim() || "Unknown Author";
      const rawTitle =
        $("titleStmt title").first().text().trim() || "Unknown Title";

      if (!rawAuthor || !rawTitle) {
        this.logger.warn(`⚠️ Missing metadata in ${xmlPath}`);
        return;
      }

      const metadata = this.getMetadata($);

      const authorSlug = _.kebabCase(rawAuthor);
      if (options?.author && authorSlug !== options.author) return;

      const titleSlug = _.kebabCase(rawTitle);
      const textSlug = `${authorSlug}/${titleSlug}`;
      if (options?.text && textSlug !== options.text) return;

      const relativeSourcePath = path.relative(sourceDataDirectory, xmlPath);
      const author = this.getOrCreateAuthor(
        authorsMap,
        authorSlug,
        rawAuthor,
        relativeSourcePath,
      );

      const textEntity = new Text();
      textEntity.metadata = { ...metadata, sourceUrl: relativeSourcePath };
      textEntity.title = rawTitle;
      textEntity.slug = titleSlug;
      textEntity.type = "text";
      author.texts.push(textEntity);

      const frontmatterObject: Record<string, unknown> = {
        author: authorSlug,
        title: rawTitle,
        type: "text",
      };
      const textMetadata = {
        ...metadata,
        source_url: `https://raw.githubusercontent.com/OpenGreekAndLatin/csel-dev/master/${relativeSourcePath}`,
      };
      if (Object.keys(textMetadata).length > 0) {
        frontmatterObject["text_metadata"] = textMetadata;
      }

      let markdown = `---\n${YAML.stringify(frontmatterObject)}---\n\n`;
      markdown += `# ${rawTitle}\n\n`;

      const paragraphs = this.extractParagraphs($);

      if (!hasValidTextContent(paragraphs)) {
        this.logger.warn(`⚠️ Skipping empty or invalid text: ${textSlug}`);
        return;
      }

      markdown += `${paragraphs.join("\n\n")}\n`;

      const authorDirectory = path.join(dataPath, authorSlug);
      await fs.mkdir(authorDirectory, { recursive: true });
      await fs.writeFile(
        path.join(authorDirectory, `${titleSlug}.md`),
        markdown,
        "utf8",
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      const progressString = ` (${(((index + 1) / totalFiles) * 100).toFixed(2)}%, ${index + 1}/${totalFiles})`;
      this.logger.log(`📜 Completed processing: ${xmlPath}${progressString}`);
    } catch (error) {
      this.logger.warn(`⚠️ Error processing ${xmlPath}: ${error}`);
    }
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

    const xmlPaths: string[] = [];
    try {
      const allFiles = await fs.readdir(sourceDataDirectory, {
        recursive: true,
        withFileTypes: true,
      });
      const filtered = allFiles
        .filter((f) => f.isFile() && f.name.endsWith(".xml"))
        .map((f) => path.join(f.parentPath, f.name));
      xmlPaths.push(...filtered);
    } catch (error) {
      this.logger.error(
        `❌ Could not read source directory: ${String(error)}. Did you run the corpus-scriptorum-ecclesiasticorum-latinorum command first?`,
      );
      return [];
    }

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
