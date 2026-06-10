import * as fs from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import * as cheerio from "cheerio";
import _ from "lodash";
import YAML from "yaml";

import { Author, Text } from "@monorepo/lexico-entities";

import { LoggerService } from "../../logger/logger.service";

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
    const host =
      "https://raw.githubusercontent.com/PerseusDL/canonical-latinLit/master/";
    this.logger.log(`Scraping library from ${host}`);

    // Fetch the entire repository tree
    const treeUrl =
      "https://api.github.com/repos/PerseusDL/canonical-latinLit/git/trees/master?recursive=1";
    this.logger.log(`Fetching Perseus tree from ${treeUrl}`);
    const treeRes = await fetch(treeUrl);

    if (!treeRes.ok) {
      this.logger.error(`Failed to fetch Perseus tree: ${treeRes.statusText}`);
      return [];
    }

    const treeData = (await treeRes.json()) as {
      tree: { path: string; type: string }[];
    };

    // Filter for Latin XML files (typically ending in lat1.xml, lat2.xml etc.)
    const xmlPaths = treeData.tree
      .filter(
        (node) =>
          node.type === "blob" &&
          node.path.endsWith(".xml") &&
          node.path.includes("-lat"),
      )
      .map((node) => node.path);

    this.logger.log(`Found ${xmlPaths.length} Latin XML files in Perseus repo`);

    const dataPath = path.resolve("data", "library", this.name);
    await fs.mkdir(dataPath, { recursive: true });

    const authorsMap = new Map<string, Author>();

    for (let i = 0; i < xmlPaths.length; i++) {
      const xmlPath = xmlPaths[i];
      if (!xmlPath) continue;

      this.logger.log(`Fetching (${i + 1}/${xmlPaths.length}): ${xmlPath}`);

      try {
        const fileUrl = host + xmlPath;
        const res = await fetch(fileUrl);
        if (!res.ok) {
          this.logger.warn(`Failed to fetch ${fileUrl}: ${res.statusText}`);
          continue;
        }

        const xmlContent = await res.text();
        const $ = cheerio.load(xmlContent, { xml: true });

        const rawAuthor = $("titleStmt author").first().text().trim();
        const rawTitle = $("titleStmt title").first().text().trim();

        if (!rawAuthor || !rawTitle) {
          this.logger.warn(`Missing metadata in ${xmlPath}`);
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

        const urnMatch = /(phi\d+\.phi\d+\.perseus-lat\d+)/.exec(xmlPath);
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
          author.metadata = { sourceUrl: xmlPath };
          author.slug = authorSlug;
          author.texts = [];
          authorsMap.set(authorSlug, author);
        }

        const textEntity = new Text();
        textEntity.metadata = { ...metadata, sourceUrl: xmlPath };
        textEntity.title = rawTitle;
        textEntity.slug = titleSlug;
        textEntity.type = "text";
        author.texts.push(textEntity);

        // Process markdown
        const frontmatterObj: Record<string, unknown> = {
          author: authorSlug,
          type: "text",
        };
        const textMetadata = { ...metadata, source_url: fileUrl };
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
              $clone.find("note, app, rdg, lem").remove();
              let text = $clone.text().trim();
              if (!text) return;
              text = text.replaceAll(/\s+/g, " ");
              const nAttr = $(pElem as string).attr("n");
              if (nAttr) text = `**${nAttr}** ${text}`;
              directParagraphs.push(text);
            });

            if (directParagraphs.length > 0) {
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
              $clone.find("note, app, rdg, lem").remove();
              let text = $clone.text().trim();
              if (!text) return;
              text = text.replaceAll(/\s+/g, " ");
              const nAttr = $(pElem as string).attr("n");
              if (nAttr) {
                text = `**${nAttr}** ${text}`;
              }
              paragraphs.push(text);
            });

            if (paragraphs.length === 0) {
              const $clone = $el.clone();
              $clone.find("note, app, rdg, lem").remove();
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
              let text = $clone.text().trim();
              if (text) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                text = text.replaceAll(/\s+/g, " ");
                paragraphs.push(text as string);
              }
            }

            if (paragraphs.length > 0) {
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
        this.logger.warn(`Error processing ${xmlPath}: ${error}`);
      }
    }

    return [...authorsMap.values()];
  }
}
