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
  public parseEtymology(
    $: cheerio.CheerioAPI,
    elt: AnyNode,
    lexeme: Lexeme,
    /**
     *
     */
  ): { etymology: string; participleTranslation?: Translation } {
    const etymologyHeaderDiv = $(elt)
      .prevAll("div.mw-heading")
      .filter((_index: number, element: AnyNode) =>
        /etymology/i.test($(element).text()),
      )
      .first();

    if (etymologyHeaderDiv.length <= 0) return { etymology: "" };

    const etymologyP = etymologyHeaderDiv.nextAll("p").first();
    if (etymologyP.length <= 0 || etymologyP.text().trim().length === 0) {
      return { etymology: "" };
    }

    const etymology = etymologyP.text().trim();

    const participleMatch =
      /((present)|(perfect)|(future)) ((active)|(passive) )?participle (\(gerundive\) )?of [A-Za-z\u00C0-\u017F]+/i.exec(
        etymology,
      );
    if (participleMatch) {
      const text = _.upperFirst(participleMatch[0].trim());
      return {
        etymology,
        participleTranslation: new Translation(text, lexeme),
      };
    }

    return { etymology };
  }
}
