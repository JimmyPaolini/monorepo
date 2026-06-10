import * as fs from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import * as cheerio from "cheerio";
import _ from "lodash";
import YAML from "yaml";

import { Author, Text } from "@monorepo/lexico-entities";

import { LoggerService } from "../../logger/logger.service";

/**
 * Provider for ingesting CSEL (Corpus Scriptorum Ecclesiasticorum Latinorum) texts.
 */
@Injectable()
export class CorpusScriptorumEcclesiasticorumLatinorumLibraryProvider {
  constructor(private readonly logger: LoggerService) {}

  readonly name = "corpus-scriptorum-ecclesiasticorum-latinorum";

  /**
   * Fetch authors, works, and output markdown files to the data directory.
   */
  async ingest(options?: {
    author?: string;
    text?: string;
  }): Promise<Author[]> {
    const host =
      "https://raw.githubusercontent.com/OpenGreekAndLatin/csel-dev/master/";
    this.logger.log(`Scraping library from ${host}`);

    const treeUrl =
      "https://api.github.com/repos/OpenGreekAndLatin/csel-dev/git/trees/master?recursive=1";
    this.logger.log(`Fetching CSEL tree from ${treeUrl}`);
    const treeRes = await fetch(treeUrl);

    if (!treeRes.ok) {
      this.logger.error(`Failed to fetch CSEL tree: ${treeRes.statusText}`);
      return [];
    }

    const treeData = (await treeRes.json()) as {
      tree: { path: string; type: string }[];
    };

    const xmlPaths = treeData.tree
      .filter(
        (node) =>
          node.type === "blob" &&
          node.path.startsWith("data/") &&
          node.path.endsWith(".xml") &&
          !node.path.endsWith("__cts__.xml"),
      )
      .map((node) => node.path);

    this.logger.log(`Found ${xmlPaths.length} Latin XML files in CSEL repo`);

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

        const rawAuthor =
          $("titleStmt author").first().text().trim() || "Unknown Author";
        const rawTitle =
          $("titleStmt title").first().text().trim() || "Unknown Title";

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

        const frontmatterObj: Record<string, unknown> = {
          author: authorSlug,
          title: rawTitle,
          type: "text",
        };
        const textMetadata = { ...metadata, source_url: fileUrl };
        if (Object.keys(textMetadata).length > 0) {
          frontmatterObj["text_metadata"] = textMetadata;
        }

        let markdown = `---\n${YAML.stringify(frontmatterObj)}---\n\n`;
        markdown += `# ${rawTitle}\n\n`;

        const paragraphs: string[] = [];

        $("body")
          .find("p, l, div[type='textpart']")
          .each((_, elem) => {
            const $el = $(elem);
            if ($el[0]?.name === "div" && $el.find("p, l").length > 0) {
              return;
            }

            let text = $el.text().trim();
            if (!text) return;

            text = text.replaceAll(/\s+/g, " ");

            const nAttr = $el.attr("n");
            if (nAttr) {
              text = `**${nAttr}** ${text}`;
            }

            paragraphs.push(text);
          });

        markdown += `${paragraphs.join("\n\n")}\n`;

        const authorDir = path.join(dataPath, authorSlug);
        await fs.mkdir(authorDir, { recursive: true });
        await fs.writeFile(
          path.join(authorDir, `${titleSlug}.md`),
          markdown,
          "utf8",
        );

        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        this.logger.warn(`Error processing ${xmlPath}: ${error}`);
      }
    }

    return [...authorsMap.values()];
  }
}
