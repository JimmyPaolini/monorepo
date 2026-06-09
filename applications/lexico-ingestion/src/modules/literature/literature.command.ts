import * as fs from "node:fs/promises";
import path from "node:path";

import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import _ from "lodash";
import { toString } from "mdast-util-to-string";
import { Command, CommandRunner } from "nest-commander";
import { remark } from "remark";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import { type DeepPartial, Repository } from "typeorm";

import { Author, Line, Text, Token, Word } from "@monorepo/lexico-entities";

import { LoggerService } from "../logger/logger.service.js";

import { authorIdToName } from "./literature.constants";

import type { Paragraph } from "mdast";

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
    private readonly logger: LoggerService,
  ) {
    super();
    this.logger.setContext(LiteratureCommand.name);
  }

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

  private async ingestAuthor(slug: string, basePath: string): Promise<void> {
    this.logger.log(`👤 Ingesting author: ${slug}`);

    try {
      const author = await this.authorRepository.save({
        name: authorIdToName[slug] || slug,
        slug,
      });

      const authorPath = path.join(basePath, slug);
      const entries = await fs.readdir(authorPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(authorPath, entry.name);

        if (entry.isDirectory()) {
          const title = _.startCase(entry.name);
          await this.ingestTextDir(author, title, entry.name, fullPath);
        } else if (entry.isFile() && entry.name.endsWith(".md")) {
          const slugName = path.basename(entry.name, ".md");
          const title = _.startCase(slugName);
          await this.ingestText(author, undefined, title, slugName, fullPath);
        }
      }
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error ingesting author ${slug}: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }

  private async ingestLines(text: Text, textPath: string): Promise<void> {
    this.logger.log(`  📜 Parsing lines for ${text.title}`);
    const content = await fs.readFile(textPath, "utf8");

    const wordMap = await this.getWordsCache();
    const tokenEntities: DeepPartial<Token>[] = [];

    const ast = remark().use(remarkFrontmatter).use(remarkGfm).parse(content);

    const paragraphs = ast.children.filter(
      (child): child is Paragraph => child.type === "paragraph",
    );

    if (paragraphs.length === 0) {
      this.logger.log(`NO LINES in ${text.slug}`);
    }

    const lineEntities = paragraphs.map((para, index) => {
      let label = `${index + 1}`;
      let lineNodes = para.children;
      const firstNode = lineNodes[0];

      if (firstNode?.type === "strong") {
        const strongNode = firstNode;
        const rawLabel = toString(strongNode).trim();

        // Extract the actual label if it's mixed with a title (e.g. "XXVII. Canis et...")
        const labelMatch = /^([IVXLCDM]+|[0-9]+[a-zA-Z]*)\.?\s*(.*)$/i.exec(
          rawLabel,
        );
        if (labelMatch?.[1]) {
          label = labelMatch[1];
          if (/^[IVXLCDM]+$/i.test(label)) {
            label = `${this.romanToDecimal(label)}`;
          }

          const remainder = labelMatch[2];
          lineNodes = lineNodes.slice(1);

          if (remainder) {
            const newNode = {
              type: "text",
              value: `${remainder} `,
            } as Extract<
              Parameters<typeof lineNodes.unshift>[0],
              { type: "text" }
            >;
            lineNodes.unshift(newNode);
          }
        } else {
          // If it doesn't match a standard label format, just use the raw label if it fits, or fallback
          if (rawLabel.length <= 32) {
            label = rawLabel;
            if (/^[IVXLCDM]+$/i.test(label)) {
              label = `${this.romanToDecimal(label)}`;
            }
          }
          lineNodes = lineNodes.slice(1);
          // If we rejected the rawLabel as a label because it was too long, we should put it back in the text
          if (rawLabel.length > 32) {
            const newNode = {
              type: "text",
              value: `${rawLabel} `,
            } as Extract<
              Parameters<typeof lineNodes.unshift>[0],
              { type: "text" }
            >;
            lineNodes.unshift(newNode);
          }
        }

        const nextNode = lineNodes[0];
        if (nextNode?.type === "text" && "value" in nextNode) {
          nextNode.value = nextNode.value.replace(/^\s+/, "");
        }
      }

      const lineText = toString({ children: lineNodes, type: "paragraph" });

      const slug = `${text.slug}_${index}`;
      return {
        author: text.author,
        data: lineText,
        index,
        label,
        slug,
        text,
      };
    });

    const savedLines: Line[] = [];
    const lineChunkSize = 1000;
    for (let i = 0; i < lineEntities.length; i += lineChunkSize) {
      const chunk = lineEntities.slice(i, i + lineChunkSize);
      const savedChunk = await this.lineRepository.save(chunk);
      savedLines.push(...savedChunk);
    }

    this.logger.log(
      `  💾 Saved ${savedLines.length} lines. Extracting tokens...`,
    );

    for (const line of savedLines) {
      const tokenStrings = line.data.match(/[\p{L}]+|[^\p{L}\s]+/gu) || [];
      tokenStrings.forEach((tokenText, index) => {
        const isPunctuation = !/^[\p{L}]+$/u.test(tokenText);
        let wordId: null | string = null;
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

    this.logger.log(
      `  💾 Saving ${tokenEntities.length} tokens for ${text.title}...`,
    );
    const chunkSize = 5000;
    for (let i = 0; i < tokenEntities.length; i += chunkSize) {
      await this.tokenRepository.insert(tokenEntities.slice(i, i + chunkSize));
    }
  }

  private async ingestText(
    author: Author,
    parentText: Text | undefined,
    title: string,
    textSlugName: string,
    textPath: string,
  ): Promise<void> {
    const textSlug = parentText
      ? `${parentText.slug}/${textSlugName}`
      : `${author.slug}/${textSlugName}`;

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
    dirSlug: string,
    dirPath: string,
  ): Promise<void> {
    const parentText = await this.textRepository.save({
      author,
      slug: `${author.slug}/${dirSlug}`,
      title,
      type: "book",
    });

    const texts = await fs.readdir(dirPath, { withFileTypes: true });
    for (const textFile of texts) {
      if (!textFile.isFile() || !textFile.name.endsWith(".md")) continue;
      const slugName = path.basename(textFile.name, ".md");
      const textTitle = _.startCase(slugName);
      const fullPath = path.join(dirPath, textFile.name);
      await this.ingestText(author, parentText, textTitle, slugName, fullPath);
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
    this.logger.log(`📚 Ingesting literature from ${dataPath}`);

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

    for (const slug of authorDirs) {
      await this.ingestAuthor(slug, dataPath);
    }

    this.logger.log("📚 Literature ingestion complete");
  }
}
