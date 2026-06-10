import * as fs from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import _ from "lodash";
import YAML from "yaml";

import { Author, Text } from "@monorepo/lexico-entities";

import { LoggerService } from "../../logger/logger.service";

interface EpigraphikDatenbankClaussSlabyRecord {
  obj: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "edcs-id"?: string;
    edcsId?: string;
    inschriften: [string, unknown, string[], string[]][];
    provinz: null | string;
  };
}

/**
 * Provider for ingesting Epigraphik-Datenbank Clauss-Slaby inscriptions.
 */
@Injectable()
export class EpigraphikDatenbankClaussSlabyLibraryProvider {
  constructor(private readonly logger: LoggerService) {}

  readonly name = "epigraphik-datenbank-clauss-slaby";

  /**
   * Parse inscriptions from Epigraphik-Datenbank Clauss-Slaby JSON files and group them by province.
   */
  async ingest(options?: {
    author?: string;
    text?: string;
  }): Promise<Author[]> {
    const host = "https://edcs.hist.uzh.ch/api/query";
    this.logger.log(
      `🗂️ Ingesting Epigraphik-Datenbank Clauss-Slaby from local data`,
    );

    const dataPath = path.resolve("data", "library", this.name);
    const authorSlug = "epigraphik-datenbank-clauss-slaby";
    if (options?.author && authorSlug !== options.author) {
      return [];
    }

    const authorDir = path.join(dataPath, authorSlug);
    await fs.mkdir(authorDir, { recursive: true });

    const author = new Author();
    author.name = "Epigraphik-Datenbank Clauss-Slaby";
    author.slug = authorSlug;
    author.metadata = { sourceUrl: host };
    author.texts = [];

    // Group records by province
    const provinceData = new Map<string, string[]>();

    const sourceDataDir = path.resolve(
      "data",
      "epigraphik-datenbank-clauss-slaby-source",
    );
    this.logger.log(
      `🗂️ Reading Epigraphik-Datenbank Clauss-Slaby chunks from ${sourceDataDir}`,
    );

    let chunkFiles: string[];
    try {
      const allFiles = await fs.readdir(sourceDataDir);
      chunkFiles = allFiles.filter(
        (f) => f.startsWith("chunk-") && f.endsWith(".json"),
      );
    } catch (error) {
      this.logger.error(
        `❌ Could not read source directory: ${String(error)}. Did you run the epigraphik-datenbank-clauss-slaby command first?`,
      );
      return [];
    }

    for (let i = 0; i < chunkFiles.length; i++) {
      const file = chunkFiles[i];
      if (!file) continue;

      this.logger.log(`📜 Starting processing chunk: ${file}`);
      try {
        const filePath = path.join(sourceDataDir, file);
        const fileContent = await fs.readFile(filePath, "utf8");
        const data = JSON.parse(fileContent) as {
          data: EpigraphikDatenbankClaussSlabyRecord[];
        };

        for (const item of data.data) {
          const obj = item.obj;
          const recordId = obj["edcs-id"] || obj.edcsId;
          const provinz = obj.provinz || "Unknown Province";

          const text = obj.inschriften[0]?.[0];
          if (!text) continue;

          // Clean up the text
          const cleanedText = text.replaceAll(/<[^>]*>?/gm, ""); // remove any stray HTML
          const markdownLine = `**${recordId}** ${cleanedText}`;

          const provArr = provinceData.get(provinz) || [];
          provArr.push(markdownLine);
          provinceData.set(provinz, provArr);
        }

        const progressString = ` (${(((i + 1) / chunkFiles.length) * 100).toFixed(2)}%, ${i + 1}/${chunkFiles.length})`;
        this.logger.log(
          `📜 Completed processing chunk: ${file}${progressString}`,
        );
      } catch (error) {
        this.logger.warn(
          `⚠️ Error reading chunk file ${file}: ${String(error)}`,
        );
      }
    }

    const booksMap = new Map<string, Text>();

    // Save each province as a book with chunked works (files)
    const provinceEntries = [...provinceData.entries()];
    let currentProvince = 0;
    const totalProvinces = provinceEntries.length;

    for (const [province, inscriptions] of provinceEntries) {
      this.logger.log(`🌍 Starting province: ${province}`);
      const bookSlug = _.kebabCase(province);
      const bookDir = path.join(authorDir, bookSlug);
      await fs.mkdir(bookDir, { recursive: true });

      let bookText = booksMap.get(province);
      if (!bookText) {
        bookText = new Text();
        bookText.type = "book";
        bookText.title = province;
        bookText.slug = bookSlug;
        bookText.childTexts = [];
        booksMap.set(province, bookText);
        author.texts.push(bookText);
      }

      // Chunk into files of 1000 inscriptions each
      const chunkSize = 1000;
      for (let i = 0; i < inscriptions.length; i += chunkSize) {
        const chunk = inscriptions.slice(i, i + chunkSize);
        const title = `${province} Part ${Math.floor(i / chunkSize) + 1}`;
        const titleSlug = _.kebabCase(title);

        const textSlug = `${authorSlug}/${bookSlug}/${titleSlug}`;
        if (options?.text && textSlug !== options.text) continue;

        const textEntity = new Text();
        textEntity.type = "text";
        textEntity.title = title;
        textEntity.slug = titleSlug;
        textEntity.metadata = { sourceUrl: `${bookSlug}/${titleSlug}.md` };
        bookText.childTexts.push(textEntity);

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

      currentProvince++;
      const provinceProgress = ` (${((currentProvince / totalProvinces) * 100).toFixed(2)}%, ${currentProvince}/${totalProvinces})`;
      this.logger.log(`🌍 Completed province: ${province}${provinceProgress}`);
    }

    return [author];
  }
}
