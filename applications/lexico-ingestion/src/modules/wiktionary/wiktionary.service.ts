import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { WiktionaryEntry } from '../../lexico-ingestion.types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const categories: Record<string, string> = {
  lemma: 'Latin_lemmas',
  participle: 'Latin_participles',
  comparative: 'Latin_comparative_adjectives',
  superlative: 'Latin_superlative_adjectives',
};

@Injectable()
export class WiktionaryService {
  private readonly logger = new Logger(WiktionaryService.name);
  private readonly host = 'https://en.wiktionary.org';
  private readonly dataDir = path.join(process.cwd(), './data/wiktionary');

  async ingestWiktionary(): Promise<void> {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    for (const category of Object.keys(categories)) {
      await this.ingestCategory(category);
    }
  }

  private async ingestCategory(category = 'lemma', startPath?: string): Promise<void> {
    this.logger.log(`START - ${category}`);
    let urlPath: string = startPath ?? (
      categories[category]
        ? `/w/index.php?title=Category:${categories[category]}&pagefrom=a`
        : category.replace(this.host, '')
    );

    try {
      while (urlPath) {
        this.logger.log(this.host + urlPath);
        const response = await axios.get<string>(this.host + urlPath);
        const $ = cheerio.load(response.data as string);

        for (const a of $(
          '#mw-pages div.mw-category > div.mw-category-group > ul > li a'
        ).toArray()) {
          const word = $(a).text();
          const href = $(a).attr('href') ?? '';
          if (word.match(/(Reconstruction:)|(Appendix:)/gi)) continue;
          await this.ingestWord(word, href, category);
        }

        urlPath = $('a:contains("next page")').eq(0).attr('href') ?? '';
      }
    } catch (error) {
      this.logger.error(
        `Error on url "${this.host}${urlPath}" - ${String(error)}`
      );
      await this.ingestCategory(urlPath);
    }
  }

  private async ingestWord(word: string, urlPath: string, category: string): Promise<void> {
    if (!urlPath.match(/.*#Latin/)) urlPath += '#Latin';
    const entry: WiktionaryEntry = {
      word,
      category,
      href: `${this.host}${urlPath}`,
    };

    if (entry.href.includes('/w/index.php')) {
      this.logger.warn(`Error "${entry.word}" - no wiktionary page`);
      return;
    }

    const response = await axios.get<string>(entry.href);
    const $ = cheerio.load(response.data as string);
    const section = $('span#Latin').parent().nextUntil('hr');

    if (section.length < 1) {
      this.logger.warn(`Error "${entry.word}" - no latin entry in wiktionary`);
      return;
    }

    const entryWithHtml: WiktionaryEntry = {
      ...entry,
      html: `<div class="${entry.word}">${$.html(section)}</div>`,
    };

    const filePath = path.join(this.dataDir, `${this.escapeCapitals(entry.word)}.json`);
    fs.writeFileSync(filePath, JSON.stringify(entryWithHtml));
    this.logger.log(`Saved ${entry.word}`);
  }

  private escapeCapitals(word: string): string {
    return word.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
  }
}
