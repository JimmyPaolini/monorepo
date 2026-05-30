/**
 * Converts a decimal number (1–3999) to a Roman numeral string.
 */
export function decimalToRoman(decimal: number): string {
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
