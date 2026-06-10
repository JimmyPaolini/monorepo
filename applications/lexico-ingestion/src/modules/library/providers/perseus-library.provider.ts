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
 * Provider for ingesting Perseus DL Latin texts.
 */
@Injectable()
export class PerseusLibraryProvider {
  constructor(private readonly logger: LoggerService) {}

  readonly name = "perseus";

  /**
   * Fetch authors, works, and output markdown files to the data directory.
   */
  async ingest(options?: {
    author?: string;
    text?: string;
  }): Promise<Author[]> {
    this.logger.log(`🗂️ Ingesting Perseus from local data`);

    const sourceDataDir = path.resolve("data", "perseus-source");

    const xmlPaths: string[] = [];
    try {
      const allFiles = await fs.readdir(sourceDataDir, {
        recursive: true,
        withFileTypes: true,
      });
      const filteredFiles = allFiles
        .filter((f) => f.isFile() && f.name.endsWith(".xml"))
        .map((f) => path.join(f.parentPath, f.name));
      xmlPaths.push(...filteredFiles);
    } catch (error) {
      this.logger.error(
        `❌ Could not read source directory: ${String(error)}. Did you run the perseus command first?`,
      );
      return [];
    }

    this.logger.log(
      `🗂️ Found ${xmlPaths.length} Latin XML files in local Perseus cache`,
    );

    const dataPath = path.resolve("data", "library", this.name);
    await fs.mkdir(dataPath, { recursive: true });

    const authorsMap = new Map<string, Author>();

    for (let i = 0; i < xmlPaths.length; i++) {
      const xmlPath = xmlPaths[i];
      if (!xmlPath) continue;

      const progressString = ` (${(((i + 1) / xmlPaths.length) * 100).toFixed(2)}%, ${i + 1}/${xmlPaths.length})`;
      this.logger.log(`📜 Processing ${xmlPath}${progressString}`);

      try {
        const xmlContent = await fs.readFile(xmlPath, "utf8");
        const $ = cheerio.load(xmlContent, { xml: true });

        const rawAuthor = $("titleStmt author").first().text().trim();
        const rawTitle = $("titleStmt title").first().text().trim();

        if (!rawAuthor || !rawTitle) {
          this.logger.warn(`⚠️ Missing metadata in ${xmlPath}`);
          continue;
        }

        const metadata: Record<string, unknown> = {};
        const editors = $("titleStmt editor")
          .map((_, el) => $(el).text().trim())
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

        const relativeSourcePath = path.relative(sourceDataDir, xmlPath);

        const urnMatch = /(phi\d+\.phi\d+\.perseus-lat\d+)/.exec(
          relativeSourcePath,
        );
        if (urnMatch) metadata["cts_urn"] = `urn:cts:latinLit:${urnMatch[1]}`;

        const authorSlug = _.kebabCase(rawAuthor);
        if (options?.author && authorSlug !== options.author) continue;

        const titleSlug = _.kebabCase(rawTitle);
        const textSlug = `${authorSlug}/${titleSlug}`;
        if (options?.text && textSlug !== options.text) continue;

        let author = authorsMap.get(authorSlug);
        if (!author) {
          author = new Author();
          author.name = rawAuthor;
          author.metadata = { sourceUrl: relativeSourcePath };
          author.slug = authorSlug;
          author.texts = [];
          authorsMap.set(authorSlug, author);
        }

        const textEntity = new Text();
        textEntity.metadata = { ...metadata, sourceUrl: relativeSourcePath };
        textEntity.title = rawTitle;
        textEntity.slug = titleSlug;
        textEntity.type = "text";
        author.texts.push(textEntity);

        // Process markdown
        const frontmatterObj: Record<string, unknown> = {
          author: authorSlug,
          type: "text",
        };
        const textMetadata = {
          ...metadata,
          source_url: `https://raw.githubusercontent.com/PerseusDL/canonical-latinLit/master/${relativeSourcePath}`,
        };
        if (Object.keys(textMetadata).length > 0) {
          frontmatterObj["text_metadata"] = textMetadata;
        }

        const filesToWrite: {
          content: string;
          relativePath: string;
          title: string;
        }[] = [];

        const extractNodes = (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          $el: any,
          currentPath: string[],
          currentTitle: string,
        ): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
          const children = $el.children("div[type='textpart']");
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          if (children.length > 0) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            children.each((_index: number, child: unknown) => {
              const $child = $(child as string);
              const subtype = $child.attr("subtype") || "section";
              const n = $child.attr("n") || "";

              const skipKeywords = [
                "front",
                "preface",
                "introduction",
                "cast",
                "subject",
                "index",
              ];
              if (
                skipKeywords.some((kw) => subtype.toLowerCase().includes(kw)) ||
                skipKeywords.some((kw) => n.toLowerCase().includes(kw))
              ) {
                return;
              }

              const partName = _.kebabCase(n ? `${subtype} ${n}` : subtype);
              const partTitle = n
                ? `${_.startCase(subtype)} ${n}`
                : _.startCase(subtype);

              extractNodes($child, [...currentPath, partName], partTitle);
            });

            const directParagraphs: string[] = [];
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            $el.children("p, l").each((_index: number, pElem: unknown) => {
              const $clone = $(pElem as string).clone();
              $clone.find("note, app, rdg, lem, sic, orig, abbr").remove();
              let text = $clone.text().trim();
              if (!text) return;
              const nAttr = $(pElem as string).attr("n");
              if (nAttr) text = `**${nAttr}** ${text}`;
              text = formatLineNumber(text);
              text = text.replaceAll(/\s+/g, " ");
              directParagraphs.push(text);
            });

            if (
              directParagraphs.length > 0 &&
              hasValidTextContent(directParagraphs)
            ) {
              filesToWrite.push({
                content: directParagraphs.join("\n\n"),
                relativePath: [...currentPath, "index.md"].join("/"),
                title: currentPath.length > 1 ? currentTitle : rawTitle,
              });
            }
          } else {
            const paragraphs: string[] = [];
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            $el.find("p, l").each((_index: number, pElem: unknown) => {
              const $clone = $(pElem as string).clone();
              $clone.find("note, app, rdg, lem, sic, orig, abbr").remove();
              let text = $clone.text().trim();
              if (!text) return;
              const nAttr = $(pElem as string).attr("n");
              if (nAttr) {
                text = `**${nAttr}** ${text}`;
              }
              text = formatLineNumber(text);
              text = text.replaceAll(/\s+/g, " ");
              paragraphs.push(text);
            });

            if (paragraphs.length === 0) {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
              const $clone = $el.clone();
              // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
              $clone.find("note, app, rdg, lem, sic, orig, abbr").remove();
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
              let text = $clone.text().trim();
              if (text) {
                const formatted = formatLineNumber(text as string);
                text = formatted.replaceAll(/\s+/g, " ");
                paragraphs.push(text as string);
              }
            }

            if (paragraphs.length > 0 && hasValidTextContent(paragraphs)) {
              filesToWrite.push({
                content: paragraphs.join("\n\n"),
                relativePath: `${currentPath.join("/")}.md`,
                title: currentPath.length > 1 ? currentTitle : rawTitle,
              });
            }
          }
        };

        extractNodes($("body"), [titleSlug], rawTitle);

        const authorDir = path.join(dataPath, authorSlug);
        for (const file of filesToWrite) {
          const fm = { ...frontmatterObj, title: file.title };
          let markdown = `---\n${YAML.stringify(fm)}---\n\n`;
          markdown += `# ${file.title}\n\n`;
          markdown += `${file.content}\n`;

          const fullPath = path.join(authorDir, file.relativePath);
          await fs.mkdir(path.dirname(fullPath), { recursive: true });
          await fs.writeFile(fullPath, markdown, "utf8");
        }

        // Small delay
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        this.logger.warn(`⚠️ Error processing ${xmlPath}: ${error}`);
      }
    }

    return [...authorsMap.values()];
  }
}
