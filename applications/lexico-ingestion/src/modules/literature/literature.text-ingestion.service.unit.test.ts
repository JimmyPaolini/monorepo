import { appendFile } from "node:fs/promises";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { Author, Text } from "@monorepo/lexico-entities";

import { LiteratureTextIngestionService } from "./literature.text-ingestion.service";

import type { LoggerService } from "../logger/logger.service";
import type { LibraryEntry } from "./literature.types";

vi.mock("node:fs/promises", () => ({
  appendFile: vi.fn(),
}));

describe("LiteratureTextIngestionService", () => {
  const loggerMock = {
    error: vi.fn(),
    log: vi.fn(),
    setContext: vi.fn(),
  };

  let service: LiteratureTextIngestionService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(appendFile).mockResolvedValue(undefined);
    service = new LiteratureTextIngestionService(
      loggerMock as unknown as LoggerService,
    );
  });

  it("is defined", () => {
    expect(service).toBeDefined();
  });

  describe("ingestTextWithLogging", () => {
    it("logs start and completion for root text entry", async () => {
      const ingestTextMock = vi.fn(async (): Promise<void> => {});
      const authorEntity = new Author();
      const textEntry: LibraryEntry = {
        authorSlug: "author",
        fullPath: "data/library/provider/author/work.md",
        pathParts: [],
        provider: "provider",
        textSlug: "work",
        title: "Work",
      };

      await service.ingestTextWithLogging(
        {
          ingestText: ingestTextMock,
        },
        {
          authorEntity,
          authorSlug: "author",
          currentText: 1,
          logFilePath: "/tmp/literature-errors.log",
          parentTexts: new Map<string, Text>(),
          textEntry,
          totalTexts: 2,
        },
      );

      expect(ingestTextMock).toHaveBeenCalledWith({
        author: authorEntity,
        parentText: undefined,
        textPath: "data/library/provider/author/work.md",
        textSlugName: "work",
        title: "Work",
      });
      expect(loggerMock.log).toHaveBeenCalledWith(
        "  📜 Starting: Work (from provider)",
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        "  ✅ Completed: Work (from provider) (50.00%, 1/2)",
      );
      expect(loggerMock.error).not.toHaveBeenCalled();
    });

    it("resolves parent text hierarchy in logs and ingest arguments", async () => {
      const ingestTextMock = vi.fn(async (): Promise<void> => {});
      const authorEntity = new Author();
      const parentText = new Text();
      parentText.slug = "author/book-1";

      const textEntry: LibraryEntry = {
        authorSlug: "author",
        fullPath: "data/library/provider/author/book-1/chapter-1.md",
        pathParts: ["book-1"],
        provider: "provider",
        textSlug: "chapter-1",
        title: "Chapter 1",
      };

      await service.ingestTextWithLogging(
        {
          ingestText: ingestTextMock,
        },
        {
          authorEntity,
          authorSlug: "author",
          currentText: 2,
          logFilePath: "/tmp/literature-errors.log",
          parentTexts: new Map<string, Text>([["author/book-1", parentText]]),
          textEntry,
          totalTexts: 2,
        },
      );

      expect(ingestTextMock).toHaveBeenCalledWith({
        author: authorEntity,
        parentText,
        textPath: "data/library/provider/author/book-1/chapter-1.md",
        textSlugName: "chapter-1",
        title: "Chapter 1",
      });
      expect(loggerMock.log).toHaveBeenCalledWith(
        "  📜 Starting: book-1 / Chapter 1 (from provider)",
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        "  ✅ Completed: book-1 / Chapter 1 (from provider) (100.00%, 2/2)",
      );
    });

    it("logs and appends error details when ingestion fails", async () => {
      const ingestTextMock = vi.fn(
        async (): Promise<void> =>
          await Promise.reject(new Error("ingestion failed")),
      );
      const authorEntity = new Author();
      const textEntry: LibraryEntry = {
        authorSlug: "author",
        fullPath: "data/library/provider/author/work.md",
        pathParts: [],
        provider: "provider",
        textSlug: "work",
        title: "Work",
      };

      await service.ingestTextWithLogging(
        {
          ingestText: ingestTextMock,
        },
        {
          authorEntity,
          authorSlug: "author",
          currentText: 1,
          logFilePath: "/tmp/literature-errors.log",
          parentTexts: new Map<string, Text>(),
          textEntry,
          totalTexts: 1,
        },
      );

      expect(loggerMock.error).toHaveBeenCalledWith(
        "❌ Failed to process Work (from provider): Error: ingestion failed",
      );
      expect(appendFile).toHaveBeenCalledWith(
        "/tmp/literature-errors.log",
        expect.stringContaining("data/library/provider/author/work.md"),
      );
      expect(loggerMock.log).toHaveBeenCalledWith(
        "  ✅ Completed: Work (from provider) (100.00%, 1/1)",
      );
    });
  });
});
