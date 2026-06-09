import * as fs from "node:fs/promises";
import path from "node:path";

import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Command, CommandRunner } from "nest-commander";
import { type DeepPartial, Repository } from "typeorm";

import { Author, Line, Text, Token, Word } from "@monorepo/lexico-entities";

import { authorIdToName } from "./literature.constants";

const ROMAN_VALUES: Record<string, number> = {
  C: 100,
  D: 500,
  I: 1,
  L: 50,
  M: 1000,
  V: 5,
  X: 10,
};

/**
 * Ingest local literature texts into the database.
 */
@Command({
  description: "Ingest local literature text files into the database",
  name: "literature",
})
@Injectable()
export class LiteratureCommand extends CommandRunner {
  constructor(
    @InjectRepository(Author)
    private readonly authorRepository: Repository<Author>,
    @InjectRepository(Text)
    private readonly textRepository: Repository<Text>,
    @InjectRepository(Line)
    private readonly lineRepository: Repository<Line>,
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
    @InjectRepository(Word)
    private readonly wordRepository: Repository<Word>,
  ) {
    super();
  }
  private readonly logger = new Logger(LiteratureCommand.name);

  private wordsCache: Map<string, string> | null = null;

  // 🌎 Public Methods

  private escapeCapitals(word: string): string {
    return word.replaceAll(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
  }

  // 🔒 Private Methods

  private async getWordsCache(): Promise<Map<string, string>> {
    if (!this.wordsCache) {
      this.logger.log("Caching dictionary words for token mapping...");
      const words = await this.wordRepository.find({
        select: { id: true, word: true },
      });
      this.wordsCache = new Map(words.map((w) => [w.word, w.id]));
      this.logger.log(`Cached ${this.wordsCache.size} words.`);
    }
    return this.wordsCache;
  }

  private async ingestAuthor(
    nickname: string,
    basePath: string,
  ): Promise<void> {
    this.logger.log(`Ingesting author: ${nickname}`);

    const author = await this.authorRepository.save({
      name: authorIdToName[nickname] || nickname,
      slug: nickname,
    });

    const authorPath = path.join(basePath, nickname);
    const entries = await fs.readdir(authorPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(authorPath, entry.name);

      if (entry.isDirectory()) {
        await this.ingestTextDir(author, entry.name, fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".txt")) {
        const title = path.basename(entry.name, ".txt");
        await this.ingestText(author, undefined, title, fullPath);
      }
    }
  }

  private async ingestLines(text: Text, textPath: string): Promise<void> {
    const content = await fs.readFile(textPath, "utf8");
    if (!content.includes(String.raw`\n`)) {
      this.logger.log(`NO LINES in ${text.slug}`);
    }

    const wordMap = await this.getWordsCache();
    const tokenEntities: DeepPartial<Token>[] = [];

    const lines = content.split(String.raw`\n`);
    const areLinesLabelled = lines.some((line: string) => /^#\S+/.test(line));

    const lineEntities = lines.map((lineText: string, lineNumber: number) => {
      let lineLabel = areLinesLabelled ? "•" : `${lineNumber + 1}`;
      const lineLabelHashtag = /^#\S+/.exec(lineText);

      if (lineLabelHashtag) {
        lineLabel = lineLabelHashtag[0].slice(1);
        if (/[IVXLCDM]+/.test(lineLabel)) {
          lineLabel = `${this.romanToDecimal(lineLabel)}`;
        }
        lineText = lineText.replace(/^#\S+ ?/, "");
      }

      const slug = `${text.slug}_${lineNumber}`;
      return {
        author: text.author,
        line: lineText,
        lineLabel,
        lineNumber,
        slug,
        text,
      };
    });

    const savedLines = await this.lineRepository.save(lineEntities);

    for (const line of savedLines) {
      const tokenStrings = line.line.match(/[\p{L}]+|[^\p{L}\s]+/gu) || [];
      tokenStrings.forEach((tokenText, index) => {
        const isPunctuation = !/^[\p{L}]+$/u.test(tokenText);
        let wordId = null;
        if (!isPunctuation) {
          const normalized = this.escapeCapitals(this.normalize(tokenText));
          wordId = wordMap.get(normalized) || null;
        }

        tokenEntities.push({
          author: line.text.author,
          index,
          isPunctuation,
          line,
          slug: `${line.slug}_${index}`,
          text: line.text,
          textValue: tokenText,
          word: wordId ? { id: wordId } : null,
        });
      });
    }

    const chunkSize = 5000;
    for (let i = 0; i < tokenEntities.length; i += chunkSize) {
      await this.tokenRepository.save(tokenEntities.slice(i, i + chunkSize));
    }
  }

  private async ingestText(
    author: Author,
    parentText: Text | undefined,
    title: string,
    textPath: string,
  ): Promise<void> {
    const textSlug = parentText
      ? `${parentText.slug}/${title}`
      : `${author.slug}/${title}`;

    const textSaveObj: DeepPartial<Text> = {
      author,
      slug: textSlug,
      title,
      type: "text",
    };
    if (parentText) {
      textSaveObj.parentText = parentText;
    }

    const text = await this.textRepository.save(textSaveObj);

    await this.ingestLines(text, textPath);
  }

  private async ingestTextDir(
    author: Author,
    title: string,
    dirPath: string,
  ): Promise<void> {
    const parentText = await this.textRepository.save({
      author,
      slug: `${author.slug}/${title}`,
      title,
      type: "book",
    });

    const texts = await fs.readdir(dirPath, { withFileTypes: true });
    for (const textFile of texts) {
      if (!textFile.isFile() || !textFile.name.endsWith(".txt")) continue;
      const textTitle = path.basename(textFile.name, ".txt");
      const fullPath = path.join(dirPath, textFile.name);
      await this.ingestText(author, parentText, textTitle, fullPath);
    }
  }

  private normalize(str: string): string {
    return str
      .normalize("NFD")
      .replaceAll(/[\u0300-\u036F]/gu, "")
      .toLowerCase()
      .trim();
  }

  private romanToDecimal(roman: string): number {
    const upperRoman = roman.toUpperCase();
    let decimal = 0;

    for (let i = 0; i < upperRoman.length; i++) {
      const v1 = ROMAN_VALUES[upperRoman.charAt(i)] || 0;
      const v2 = ROMAN_VALUES[upperRoman.charAt(i + 1)] || 0;
      if (i + 1 < upperRoman.length && v1 < v2) {
        decimal -= v1;
      } else {
        decimal += v1;
      }
    }
    return decimal;
  }

  /** Runs the literature ingestion pipeline. */
  async run(): Promise<void> {
    const dataPath = path.resolve("data", "library");
    this.logger.log(`Ingesting literature from ${dataPath}`);

    try {
      await fs.access(dataPath);
    } catch {
      this.logger.warn(`Directory not found: ${dataPath}`);
      return;
    }

    const readdirResult = await fs.readdir(dataPath, { withFileTypes: true });
    const authorDirs = readdirResult
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);

    for (const nickname of authorDirs) {
      await this.ingestAuthor(nickname, dataPath);
    }

    this.logger.log("Literature ingestion complete");
  }
}
