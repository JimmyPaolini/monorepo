import * as fs from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import _ from "lodash";
import YAML from "yaml";

import { Author, Text } from "@monorepo/lexico-entities";

import { LoggerService } from "../../logger/logger.service";

interface EpigraphikDatenbankClaussSlabyRecord {
  obj: {
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

  // 🔏 Private Methods

  private createEdcsAuthor(authorSlug: string, host: string): Author {
    const author = new Author();
    author.name = "Epigraphik-Datenbank Clauss-Slaby";
    author.slug = authorSlug;
    author.metadata = { sourceUrl: host };
    author.texts = [];
    return author;
  }

  private getOrCreateBookText(
    province: string,
    bookSlug: string,
    booksMap: Map<string, Text>,
    author: Author,
  ): Text {
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
    return bookText;
  }

  private async processEdcsChunkFile(
    file: string,
    sourceDataDirectory: string,
    provinceData: Map<string, string[]>,
    index: number,
    total: number,
  ): Promise<void> {
    this.logger.log(`📜 Starting processing chunk: ${file}`);
    try {
      const filePath = path.join(sourceDataDirectory, file);
      const fileContent = await fs.readFile(filePath, "utf8");
      const data = JSON.parse(fileContent) as {
        data: EpigraphikDatenbankClaussSlabyRecord[];
      };
      for (const item of data.data) this.processEdcsRecord(item, provinceData);
      const progressString = ` (${(((index + 1) / total) * 100).toFixed(2)}%, ${index + 1}/${total})`;
      this.logger.log(
        `📜 Completed processing chunk: ${file}${progressString}`,
      );
    } catch (error) {
      this.logger.warn(`⚠️ Error reading chunk file ${file}: ${String(error)}`);
    }
  }

  private async processEdcsChunkPhase(
    chunkFiles: string[],
    sourceDataDirectory: string,
  ): Promise<Map<string, string[]>> {
    const provinceData = new Map<string, string[]>();
    for (let index = 0; index < chunkFiles.length; index++) {
      const file = chunkFiles[index];
      if (!file) continue;
      await this.processEdcsChunkFile(
        file,
        sourceDataDirectory,
        provinceData,
        index,
        chunkFiles.length,
      );
    }
    return provinceData;
  }

  private processEdcsRecord(
    item: EpigraphikDatenbankClaussSlabyRecord,
    provinceData: Map<string, string[]>,
  ): void {
    const object = item.obj;
    const recordId = object["edcs-id"] || object.edcsId;
    const provinz = object.provinz || "Unknown Province";
    const text = object.inschriften[0]?.[0];
    if (!text) return;
    const cleanedText = text.replaceAll(/<[^>]*>?/gm, "");
    const markdownLine = `**${recordId}** ${cleanedText}`;
    const provArray = provinceData.get(provinz) || [];
    provArray.push(markdownLine);
    provinceData.set(provinz, provArray);
  }

  private async readEdcsChunkFiles(
    sourceDataDirectory: string,
  ): Promise<null | string[]> {
    try {
      const files = await fs.readdir(sourceDataDirectory);
      return files.filter((file) => file.endsWith(".json"));
    } catch (error) {
      this.logger.error(
        `❌ Could not read source directory: ${String(error)}. Did you run the epigraphik-datenbank-clauss-slaby command first?`,
      );
      return null;
    }
  }

  private async saveEdcsChunkFile(
    chunk: string[],
    title: string,
    titleSlug: string,
    bookSlug: string,
    authorSlug: string,
    bookDirectory: string,
    bookText: Text,
  ): Promise<void> {
    const textEntity = new Text();
    textEntity.type = "text";
    textEntity.title = title;
    textEntity.slug = titleSlug;
    textEntity.metadata = { sourceUrl: `${bookSlug}/${titleSlug}.md` };
    bookText.childTexts.push(textEntity);
    const frontmatterObject = {
      author: authorSlug,
      text_metadata: { source_url: "https://db.edcs.eu" },
      title,
      type: "text",
    };
    let markdown = `---\n${YAML.stringify(frontmatterObject)}---\n\n`;
    markdown += `# ${title}\n\n`;
    markdown += `${chunk.join("\n\n")}\n`;
    await fs.writeFile(
      path.join(bookDirectory, `${titleSlug}.md`),
      markdown,
      "utf8",
    );
  }

  private async saveEdcsProvince(
    province: string,
    inscriptions: string[],
    options: undefined | { text?: string },
    authorSlug: string,
    authorDirectory: string,
    booksMap: Map<string, Text>,
    author: Author,
  ): Promise<void> {
    this.logger.log(`🌍 Starting province: ${province}`);
    const bookSlug = _.kebabCase(province);
    const bookDirectory = path.join(authorDirectory, bookSlug);
    await fs.mkdir(bookDirectory, { recursive: true });
    const bookText = this.getOrCreateBookText(
      province,
      bookSlug,
      booksMap,
      author,
    );
    const chunkSize = 1000;
    for (let index = 0; index < inscriptions.length; index += chunkSize) {
      const chunk = inscriptions.slice(index, index + chunkSize);
      const title = `${province} Part ${Math.floor(index / chunkSize) + 1}`;
      const titleSlug = _.kebabCase(title);
      const textSlug = `${authorSlug}/${bookSlug}/${titleSlug}`;
      if (options?.text && textSlug !== options.text) continue;
      await this.saveEdcsChunkFile(
        chunk,
        title,
        titleSlug,
        bookSlug,
        authorSlug,
        bookDirectory,
        bookText,
      );
    }
    this.logger.log(`🌍 Completed province: ${province}`);
  }

  private async saveEdcsProvincePhase(
    provinceData: Map<string, string[]>,
    options: undefined | { text?: string },
    authorSlug: string,
    author: Author,
    authorDirectory: string,
  ): Promise<void> {
    const booksMap = new Map<string, Text>();
    const provinceEntries = [...provinceData.entries()];
    const totalProvinces = provinceEntries.length;
    let currentProvince = 0;
    for (const [province, inscriptions] of provinceEntries) {
      await this.saveEdcsProvince(
        province,
        inscriptions,
        options,
        authorSlug,
        authorDirectory,
        booksMap,
        author,
      );
      currentProvince++;
      const progress = ` (${((currentProvince / totalProvinces) * 100).toFixed(2)}%, ${currentProvince}/${totalProvinces})`;
      this.logger.log(`🌍 Completed province: ${province}${progress}`);
    }
  }

  // 🌎 Public Methods

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
    if (options?.author && authorSlug !== options.author) return [];
    const authorDirectory = path.join(dataPath, authorSlug);
    await fs.mkdir(authorDirectory, { recursive: true });
    const author = this.createEdcsAuthor(authorSlug, host);
    const sourceDataDirectory = path.resolve(
      "data",
      "epigraphik-datenbank-clauss-slaby-source",
    );
    this.logger.log(
      `🗂️ Reading Epigraphik-Datenbank Clauss-Slaby chunks from ${sourceDataDirectory}`,
    );
    const chunkFiles = await this.readEdcsChunkFiles(sourceDataDirectory);
    if (!chunkFiles) return [];
    const provinceData = await this.processEdcsChunkPhase(
      chunkFiles,
      sourceDataDirectory,
    );
    await this.saveEdcsProvincePhase(
      provinceData,
      options,
      authorSlug,
      author,
      authorDirectory,
    );
    return [author];
  }
}
