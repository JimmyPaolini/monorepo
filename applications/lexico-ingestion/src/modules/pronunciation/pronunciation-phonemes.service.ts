import { Injectable } from "@nestjs/common";

import type { EcclesiasticalPhonemeMap } from "./pronunciation.types";

/**
 * Provides shared phoneme lookup utilities.
 */
@Injectable()
export class PronunciationPhonemesService {
  // 🏗 Dependency Injection

  constructor() {}

  /**
   * Gets a string phoneme from a mixed phoneme map or returns an empty string.
   */
  public getStringPhoneme(map: EcclesiasticalPhonemeMap, key: string): string {
    const value = map[key];
    return typeof value === "string" ? value : "";
  }
}
