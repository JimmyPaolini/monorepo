import * as fs from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import _ from "lodash";
import YAML from "yaml";

import { Author, Text } from "@monorepo/lexico-entities";

import { LoggerService } from "../../logger/logger.service";

/**
 * Provider for ingesting Musisque Deoque (MQDQ) texts from a JSON mirror.
 */
@Injectable()
export class MusisqueDeoqueLibraryProvider {
  constructor(private readonly logger: LoggerService) {}

  readonly name = "musisque-deoque";

  /**
   * Fetch authors, works, and output markdown files to the data directory.
   */
  async ingest(options?: {
    author?: string;
    text?: string;
  }): Promise<Author[]> {
    const host =
      "https://raw.githubusercontent.com/souravsingh/latin_text_musisque_deoque/master/";
    this.logger.log(`Scraping MQDQ from ${host}`);

    const treeUrl =
      "https://api.github.com/repos/souravsingh/latin_text_musisque_deoque/git/trees/master?recursive=1";
    this.logger.log(`Fetching MQDQ tree from ${treeUrl}`);
    const treeRes = await fetch(treeUrl);

    if (!treeRes.ok) {
      this.logger.error(`Failed to fetch MQDQ tree: ${treeRes.statusText}`);
      return [];
    }

    const treeData = (await treeRes.json()) as {
      tree: { path: string; type: string }[];
    };

    const jsonPaths = treeData.tree
      .filter((node) => node.type === "blob" && node.path.endsWith(".json"))
      .map((node) => node.path);

    this.logger.log(`Found ${jsonPaths.length} JSON files in MQDQ repo`);

    const dataPath = path.resolve("data", "library", this.name);
    await fs.mkdir(dataPath, { recursive: true });

    const authorsMap = new Map<string, Author>();

    for (let i = 0; i < jsonPaths.length; i++) {
      const jsonPath = jsonPaths[i];
      if (!jsonPath) continue;

      this.logger.log(`Fetching (${i + 1}/${jsonPaths.length}): ${jsonPath}`);

      try {
        const fileUrl = host + jsonPath;
        const res = await fetch(fileUrl);
        if (!res.ok) {
          this.logger.warn(`Failed to fetch ${fileUrl}: ${res.statusText}`);
          continue;
        }

        const data = (await res.json()) as {
          author: string;
          text: string;
          title: string;
        };

        const rawAuthor = data.author || "Unknown Author";
        const rawTitle = data.title || "Unknown Title";

        const authorSlug = _.kebabCase(rawAuthor);
        if (options?.author && authorSlug !== options.author) continue;

        const titleSlug = _.kebabCase(rawTitle);
        const textSlug = `${authorSlug}/${titleSlug}`;
        if (options?.text && textSlug !== options.text) continue;

        let author = authorsMap.get(authorSlug);
        if (!author) {
          author = new Author();
          author.name = rawAuthor;
          author.metadata = { sourceUrl: jsonPath };
          author.slug = authorSlug;
          author.texts = [];
          authorsMap.set(authorSlug, author);
        }

        const textEntity = new Text();
        textEntity.metadata = { sourceUrl: jsonPath };
        textEntity.title = rawTitle;
        textEntity.slug = titleSlug;
        textEntity.type = "text";
        author.texts.push(textEntity);

        const frontmatterObj: Record<string, unknown> = {
          author: authorSlug,
          text_metadata: { source_url: fileUrl },
          title: rawTitle,
          type: "text",
        };

        let markdown = `---\n${YAML.stringify(frontmatterObj)}---\n\n`;
        markdown += `# ${rawTitle}\n\n`;

        // The text is stored directly as a string with newlines.
        // We will process it into paragraphs (or just preserve the newlines).
        const paragraphs = data.text
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

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
        this.logger.warn(`Error processing ${jsonPath}: ${error}`);
      }
    }

    return [...authorsMap.values()];
  }
}
