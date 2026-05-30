/**
 *
 */
export function normalize(str: string): string {
  return str
    .normalize("NFC")
    .replaceAll(/[\u0300-\u036F]/gu, "")
    .toLowerCase()
    .trim();
}

/**
 *
 */
export function escapeCapitals(word: string): string {
  return word.replaceAll(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
}

/**
 *
 */
export function capitalizeFirstLetter(str: string): string {
  if (str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
