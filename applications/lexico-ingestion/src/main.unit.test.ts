import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

describe("environmentSchema", () => {
  it("matches defaults in .env.default", async () => {
    const envDefaultPath = path.join(import.meta.dirname, "..", ".env.default");
    const envContent = await readFile(envDefaultPath, "utf8");

    expect(envContent).toContain("INPUT_SOURCE_TYPE=wiktionary-latin");
    expect(envContent).toContain(
      "INPUT_SOURCE_PATH=./data/wiktionary-latin-entry.md",
    );
    expect(envContent).toContain("POSTGRES_HOST=localhost");
    expect(envContent).toContain("POSTGRES_PORT=5432");
    expect(envContent).toContain("POSTGRES_USER=postgres");
    expect(envContent).toContain("POSTGRES_PASSWORD=postgres");
    expect(envContent).toContain("POSTGRES_DATABASE=lexico_ingestion");
  });
});
