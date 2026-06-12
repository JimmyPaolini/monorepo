import { Injectable } from "@nestjs/common";

import { ROMAN_VALUES } from "./numerals.constants";

/**
 * Service to handle roman numerals.
 */
@Injectable()
export class NumeralsService {
  // 🏗 Dependency Injection

  constructor() {}

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

  /**
   *
   */
  public toDecimal(roman: string): number {
    const upperRoman = roman.toUpperCase();
    let decimal = 0;

    for (let index = 0; index < upperRoman.length; index++) {
      const v1 = ROMAN_VALUES[upperRoman.charAt(index)] || 0;
      const v2 = ROMAN_VALUES[upperRoman.charAt(index + 1)] || 0;
      if (index + 1 < upperRoman.length && v1 < v2) {
        decimal -= v1;
      } else {
        decimal += v1;
      }
    }
    return decimal;
  }

  /**
   *
   */
  public toRoman(decimal: number): string {
    if (decimal < 1 || decimal > 3999) {
      throw new Error(
        `Decimal ${decimal} is out of range for Roman numerals (1–3999)`,
      );
    }

    let roman = "";

    function convertDigit(
      digit: number,
      low: string,
      mid: string,
      top: string,
    ): void {
      if (digit < 4) roman += low.repeat(digit);
      else if (digit === 4) roman += low + mid;
      else if (digit < 9) roman += mid + low.repeat(digit - 5);
      else if (digit === 9) roman += low + top;
    }

    convertDigit(Math.floor((decimal % 10_000) / 1000), "M", "", "");
    convertDigit(Math.floor((decimal % 1000) / 100), "C", "D", "M");
    convertDigit(Math.floor((decimal % 100) / 10), "X", "L", "C");
    convertDigit(Math.floor((decimal % 10) / 1), "I", "V", "X");

    return roman;
  }
}
