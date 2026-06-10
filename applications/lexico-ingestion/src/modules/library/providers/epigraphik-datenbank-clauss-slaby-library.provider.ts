import * as fs from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import _ from "lodash";
import YAML from "yaml";

import { Author, Text } from "@monorepo/lexico-entities";

import { LoggerService } from "../../logger/logger.service";

interface EdcsRecord {
  obj: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "edcs-id"?: string;
    edcsId?: string;
    inschriften: [string, unknown, string[], string[]][];
    provinz: null | string;
  };
}

interface LocalAuthor {
  metadata?: Record<string, unknown>;
  name: string;
  nickname: string;
  path: string;
  slug: string;
  works: LocalWork[];
}

interface LocalWork {
  book: string;
  metadata?: Record<string, unknown>;
  path: string;
  title: string;
}

/**
 * Provider for ingesting EDCS (Epigraphik-Datenbank Clauss-Slaby) inscriptions.
 */
@Injectable()
export class EpigraphikDatenbankClaussSlabyLibraryProvider {
  constructor(private readonly logger: LoggerService) {}

  readonly name = "epigraphik-datenbank-clauss-slaby";

  /**
   * Fetch inscriptions from EDCS via their JSON API and group them by province.
   */
  async ingest(options?: {
    author?: string;
    text?: string;
  }): Promise<Author[]> {
    const host = "https://edcs.hist.uzh.ch/api/query";
    this.logger.log(`Fetching from EDCS API at ${host}`);

    const dataPath = path.resolve("data", "library", this.name);
    const authorSlug = "epigraphik-datenbank-clauss-slaby";
    if (options?.author && authorSlug !== options.author) {
      return [];
    }

    const authorDir = path.join(dataPath, authorSlug);
    await fs.mkdir(authorDir, { recursive: true });

    const author: LocalAuthor = {
      name: "Epigraphik-Datenbank Clauss-Slaby",
      nickname: "EDCS",
      path: host,
      slug: authorSlug,
      works: [],
    };

    // We'll fetch up to 1,000,000 records to capture the full 500,000+ corpus.
    const limit = 1_000_000;
    const batchSize = 1000;

    // Group records by province
    const provinceData = new Map<string, string[]>();

    for (let start = 0; start < limit; start += batchSize) {
      this.logger.log(
        `Fetching EDCS records ${start} to ${start + batchSize}...`,
      );
      try {
        const res = await fetch(`${host}?start=${start}&length=${batchSize}`);
        if (!res.ok) {
          this.logger.warn(`Failed to fetch EDCS records: ${res.statusText}`);
          continue;
        }

        const data = (await res.json()) as { data: EdcsRecord[] };

        if (data.data.length === 0) {
          this.logger.log(`No more EDCS records found after ${start}.`);
          break;
        }

        for (const item of data.data) {
          const obj = item.obj;
          const edcsId = obj["edcs-id"] || obj.edcsId;
          const provinz = obj.provinz || "Unknown Province";

          const text = obj.inschriften[0]?.[0];
          if (!text) continue;

          // Clean up the text
          const cleanedText = text.replaceAll(/<[^>]*>?/gm, ""); // remove any stray HTML
          const markdownLine = `**${edcsId}** ${cleanedText}`;

          const provArr = provinceData.get(provinz) || [];
          provArr.push(markdownLine);
          provinceData.set(provinz, provArr);
        }

        // Small delay to be polite to the API
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        this.logger.warn(`Error fetching EDCS chunk: ${error}`);
      }
    }

    // Save each province as a book with chunked works (files)
    for (const [province, inscriptions] of provinceData.entries()) {
      const bookSlug = _.kebabCase(province);
      const bookDir = path.join(authorDir, bookSlug);
      await fs.mkdir(bookDir, { recursive: true });

      // Chunk into files of 1000 inscriptions each
      const chunkSize = 1000;
      for (let i = 0; i < inscriptions.length; i += chunkSize) {
        const chunk = inscriptions.slice(i, i + chunkSize);
        const title = `${province} Part ${Math.floor(i / chunkSize) + 1}`;
        const titleSlug = _.kebabCase(title);

        const textSlug = `${authorSlug}/${bookSlug}/${titleSlug}`;
        if (options?.text && textSlug !== options.text) continue;

        const workDto: LocalWork = {
          book: province,
          path: `${bookSlug}/${titleSlug}.md`,
          title,
        };
        author.works.push(workDto);

        const frontmatterObj: Record<string, unknown> = {
          author: authorSlug,
          text_metadata: { source_url: "https://db.edcs.eu" },
          title,
          type: "text",
        };

        let markdown = `---\n${YAML.stringify(frontmatterObj)}---\n\n`;
        markdown += `# ${title}\n\n`;
        markdown += `${chunk.join("\n\n")}\n`;

        await fs.writeFile(
          path.join(bookDir, `${titleSlug}.md`),
          markdown,
          "utf8",
        );
      }
    }

    const authorEntity = new Author();
    authorEntity.name = author.name;
    authorEntity.slug = author.slug;
    authorEntity.metadata = { sourceUrl: author.path };
    authorEntity.texts = [];

    const booksMap = new Map<string, Text>();
    for (const localWork of author.works) {
      let bookText = booksMap.get(localWork.book);
      if (!bookText) {
        bookText = new Text();
        bookText.type = "book";
        bookText.title = localWork.book;
        bookText.slug = _.kebabCase(localWork.book);
        bookText.childTexts = [];
        booksMap.set(localWork.book, bookText);
        authorEntity.texts.push(bookText);
      }

      const textEntity = new Text();
      textEntity.type = "text";
      textEntity.title = localWork.title;
      textEntity.slug = _.kebabCase(localWork.title);
      textEntity.metadata = { sourceUrl: localWork.path };
      bookText.childTexts.push(textEntity);
    }

    return [authorEntity];
  }
}
