import { Injectable } from "@nestjs/common";
import _ from "lodash";

import { Lexeme, Translation } from "@monorepo/lexico-entities";

import type * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";

/**
 * Service for parsing etymology data from Wiktionary HTML.
 */
@Injectable()
export class EtymologyService {
  // 🏗 Dependency Injection

  constructor() {}

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

  /**
   *
   */
  public parse(
    $: cheerio.CheerioAPI,
    elt: AnyNode,
    lexeme: Lexeme,
    /**
     *
     */
  ): { etymology: string; participleTranslation?: Translation } {
    const etymologyHeadingElement = $(elt)
      .prevAll("div.mw-heading")
      .filter((_index: number, element: AnyNode) =>
        /etymology/i.test($(element).text()),
      )
      .first();

    if (etymologyHeadingElement.length <= 0) return { etymology: "" };

    const etymologyParagraph = etymologyHeadingElement.nextAll("p").first();
    if (
      etymologyParagraph.length <= 0 ||
      etymologyParagraph.text().trim().length === 0
    ) {
      return { etymology: "" };
    }

    const etymology = etymologyParagraph.text().trim();

    const participleTranslationMatch =
      /((present)|(perfect)|(future)) ((active)|(passive) )?participle (\(gerundive\) )?of [A-Za-z\u00C0-\u017F]+/i.exec(
        etymology,
      );
    if (participleTranslationMatch) {
      const text = _.upperFirst(participleTranslationMatch[0].trim());
      return {
        etymology,
        participleTranslation: new Translation(text, lexeme),
      };
    }

    return { etymology };
  }
}
