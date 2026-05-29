import { describe, expect, it, vi } from "vitest";

import { LexicoIngestionCommand } from "./lexicoIngestion.command";

import type { LexicoIngestionService } from "./lexicoIngestion.service";

describe("LexicoIngestionCommand", () => {
  it("ingests wiktionary latin entries using the configured source path", async () => {
    const ingestWiktionaryLatin = vi.fn().mockResolvedValue({ id: "test-id" });
    const command = new LexicoIngestionCommand({
      ingestWiktionaryLatin,
    } as unknown as LexicoIngestionService);

    await command.run([], {
      INPUT_SOURCE_TYPE: "wiktionary-latin",
      INPUT_SOURCE_PATH: "/tmp/wiktionary-latin-entry.md",
      POSTGRES_HOST: "localhost",
      POSTGRES_PORT: 5432,
      POSTGRES_USER: "postgres",
      POSTGRES_PASSWORD: "postgres",
      POSTGRES_DATABASE: "lexico_ingestion",
    });

    expect(ingestWiktionaryLatin).toHaveBeenCalledWith(
      "/tmp/wiktionary-latin-entry.md",
    );
  });

  it("rejects unsupported source types", async () => {
    const ingestWiktionaryLatin = vi.fn().mockResolvedValue({ id: "test-id" });
    const command = new LexicoIngestionCommand({
      ingestWiktionaryLatin,
    } as unknown as LexicoIngestionService);

    await expect(
      command.run([], {
        INPUT_SOURCE_TYPE: "unsupported",
        INPUT_SOURCE_PATH: "/tmp/source.md",
        POSTGRES_HOST: "localhost",
        POSTGRES_PORT: 5432,
        POSTGRES_USER: "postgres",
        POSTGRES_PASSWORD: "postgres",
        POSTGRES_DATABASE: "lexico_ingestion",
      }),
    ).rejects.toThrow("Unsupported source type: unsupported");

    expect(ingestWiktionaryLatin).not.toHaveBeenCalled();
  });
});
