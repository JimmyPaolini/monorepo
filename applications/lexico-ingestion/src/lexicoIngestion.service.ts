import { readFile } from "node:fs/promises";
import path from "node:path";

import { LearningMaterialEntity } from "@monorepo/lexico-ingestion-entities";
import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

interface ParsedWiktionarySection {
  heading: { level: number; text: string };
  content: string;
}

interface LearningMaterialMetadata {
  title: string;
  sourceType: string;
  sourceId: string;
  sourceUrl: string;
  languageCode: string;
  tags: string[];
}

/** Service for processing and persisting Wiktionary Latin entries. */
@Injectable()
export class LexicoIngestionService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * Parses a Wiktionary Latin markdown file and persists the resulting record.
   *
   * @param markdownPath - Path to the Wiktionary markdown source file.
   * @returns Persisted learning material entity.
   */
  async ingestWiktionaryLatin(
    markdownPath: string,
  ): Promise<LearningMaterialEntity> {
    await this.ensureInitialized();

    const markdown = await readFile(markdownPath, "utf8");
    const metadata = this.buildMetadata(markdownPath, markdown);
    const content = this.buildLearningMaterialContent(markdown);

    const repository = this.dataSource.getRepository(LearningMaterialEntity);
    const entity = repository.create({
      ...metadata,
      content,
    });

    return await repository.save(entity);
  }

  private async ensureInitialized(): Promise<void> {
    if (this.dataSource.isInitialized) {
      return;
    }

    await this.dataSource.initialize();
  }

  private buildMetadata(
    markdownPath: string,
    markdown: string,
  ): LearningMaterialMetadata {
    const term = this.extractWiktionaryTerm(markdown);

    return {
      title: term,
      sourceType: "wiktionary-latin",
      sourceId: path.basename(markdownPath, path.extname(markdownPath)),
      sourceUrl: `https://en.wiktionary.org/wiki/${encodeURIComponent(term.replaceAll(/\s+/g, "_"))}`,
      languageCode: "la",
      tags: ["wiktionary", "latin", "dictionary-entry"],
    };
  }

  private buildLearningMaterialContent(markdown: string): string {
    const latinSections = this.parseWiktionarySections(markdown)
      .filter((section) => section.heading.text.toLowerCase() === "latin")
      .map((section) => ({
        heading: section.heading.text,
        body: this.stripWikiMarkup(section.content),
      }))
      .filter((section) => section.body.length > 0);

    const term = this.extractWiktionaryTerm(markdown);

    return [
      `# ${term}`,
      "",
      `Processed Wiktionary Latin entry for ${term}.`,
      "",
      ...latinSections.flatMap((section) => [
        `## ${section.heading}`,
        "",
        section.body,
        "",
      ]),
    ]
      .join("\n")
      .trim();
  }

  private extractWiktionaryTerm(markdown: string): string {
    const titleMatch = /^#\s+(.+)$/m.exec(markdown);

    if (titleMatch) {
      return titleMatch.at(1)?.trim() ?? "Untitled Wiktionary Entry";
    }

    const firstHeadingMatch = /^={2,6}\s*(.+?)\s*={2,6}\s*$/m.exec(markdown);

    if (firstHeadingMatch) {
      return firstHeadingMatch.at(1)?.trim() ?? "Untitled Wiktionary Entry";
    }

    return "Untitled Wiktionary Entry";
  }

  private stripWikiMarkup(content: string): string {
    const sanitized = content
      .replaceAll(/\{\{([^}|]+)(?:\|[^}]*)?\}\}/g, "$1")
      .replaceAll(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2")
      .replaceAll(/\[\[([^\]]+)\]\]/g, "$1")
      .replaceAll(/'''([^']+)'''/g, "$1")
      .replaceAll(/''([^']+)''/g, "$1")
      .replaceAll(/\n{3,}/g, "\n\n")
      .trim();

    return this.escapeHtml(sanitized);
  }

  private escapeHtml(content: string): string {
    return content
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  private parseWiktionarySections(markdown: string): ParsedWiktionarySection[] {
    const sections: ParsedWiktionarySection[] = [];
    const lines = markdown.split(/\r?\n/);

    let currentHeading: ParsedWiktionarySection["heading"] | null = null;
    let buffer: string[] = [];

    const flushSection = (): void => {
      if (!currentHeading) {
        buffer = [];
        return;
      }

      sections.push({
        heading: currentHeading,
        content: buffer.join("\n").trim(),
      });

      buffer = [];
    };

    for (const line of lines) {
      const headingMatch = /^(={2,6})\s*(.+?)\s*\1\s*$/.exec(line);

      if (headingMatch) {
        flushSection();
        currentHeading = {
          level: headingMatch.at(1)?.length ?? 0,
          text: headingMatch.at(2)?.trim() ?? "",
        };
        continue;
      }

      if (currentHeading) {
        buffer.push(line);
      }
    }

    flushSection();

    return sections;
  }
}
