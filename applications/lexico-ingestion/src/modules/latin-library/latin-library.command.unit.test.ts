import { Test } from "@nestjs/testing";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LoggerModule } from "../logger/logger.module";
import { LoggerService } from "../logger/logger.service";

import { LatinLibraryCommand } from "./latin-library.command";

const { appendFileMock, mkdirMock, readFileMock, writeFileMock } = vi.hoisted(
  () => ({
    appendFileMock: vi.fn<() => Promise<void>>(),
    mkdirMock: vi.fn<() => Promise<void>>(),
    readFileMock: vi.fn<() => Promise<string>>(),
    writeFileMock: vi.fn<() => Promise<void>>(),
  }),
);

vi.mock("node:fs/promises", () => ({
  appendFile: appendFileMock,
  mkdir: mkdirMock,
  readFile: readFileMock,
  writeFile: writeFileMock,
}));

function createLoggerServiceMock(): {
  error: ReturnType<typeof vi.fn>;
  log: ReturnType<typeof vi.fn>;
  setContext: ReturnType<typeof vi.fn>;
  warn: ReturnType<typeof vi.fn>;
} {
  return {
    error: vi.fn(),
    log: vi.fn(),
    setContext: vi.fn(),
    warn: vi.fn(),
  };
}

describe(LatinLibraryCommand, () => {
  let command: LatinLibraryCommand;
  let latinLibraryCommand: LatinLibraryCommand;

  const loggerService = {
    error: vi.fn<(...parameters: unknown[]) => void>(),
    log: vi.fn<(...parameters: unknown[]) => void>(),
    setContext: vi.fn<(context: string) => void>(),
    warn: vi.fn<(...parameters: unknown[]) => void>(),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        LatinLibraryCommand,
        {
          provide: LoggerService,
          useValue: createLoggerServiceMock(),
        },
      ],
    }).compile();

    command = await module.resolve(LatinLibraryCommand);
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    mkdirMock.mockResolvedValue(undefined);
    appendFileMock.mockResolvedValue(undefined);

    const moduleRef = await Test.createTestingModule({
      providers: [
        LatinLibraryCommand,
        {
          provide: LoggerService,
          useValue: loggerService,
        },
      ],
    }).compile();

    latinLibraryCommand = await moduleRef.resolve(LatinLibraryCommand);
  });

  it("is defined", () => {
    expect(command).toBeDefined();
  });

  it("should initialize command with logger context", () => {
    expect(latinLibraryCommand).toBeDefined();
    expect(loggerService.setContext).toHaveBeenCalledWith(
      "LatinLibraryCommand",
    );
  });

  it("should skip ignored link filenames", () => {
    const shouldSkipLink = (
      latinLibraryCommand as unknown as {
        shouldSkipLink: (href: string) => boolean;
      }
    ).shouldSkipLink.bind(latinLibraryCommand);

    expect(shouldSkipLink("index.html")).toBe(true);
    expect(shouldSkipLink("mailto:hello@example.com")).toBe(true);
    expect(shouldSkipLink("chapter.pdf")).toBe(true);
    expect(shouldSkipLink("vergil/aeneid.html")).toBe(false);
    expect(shouldSkipLink("vergil/aeneid")).toBe(false);
  });

  it("should derive relative paths and base urls", () => {
    const getRelativePath = (
      latinLibraryCommand as unknown as {
        getRelativePath: (urlString: string, host: string) => string;
      }
    ).getRelativePath.bind(latinLibraryCommand);

    const getBaseUrl = (
      latinLibraryCommand as unknown as {
        getBaseUrl: (urlString: string) => string;
      }
    ).getBaseUrl.bind(latinLibraryCommand);

    expect(
      getRelativePath(
        "https://www.thelatinlibrary.com/",
        "https://www.thelatinlibrary.com/",
      ),
    ).toBe("index.html");
    expect(
      getRelativePath(
        "https://www.thelatinlibrary.com/vergil/",
        "https://www.thelatinlibrary.com/",
      ),
    ).toBe("vergil/index.html");
    expect(
      getRelativePath(
        "https://www.thelatinlibrary.com/vergil/aeneid",
        "https://www.thelatinlibrary.com/",
      ),
    ).toBe("vergil/aeneid.html");

    expect(getBaseUrl("https://www.thelatinlibrary.com/vergil")).toBe(
      "https://www.thelatinlibrary.com/vergil/",
    );
    expect(
      getBaseUrl("https://www.thelatinlibrary.com/vergil/index.html"),
    ).toBe("https://www.thelatinlibrary.com/vergil/index.html");
  });

  it("should read cached page before downloading", async () => {
    readFileMock.mockResolvedValueOnce("cached html");

    const result = await (
      latinLibraryCommand as unknown as {
        fetchAndCachePage: (urlString: string, host: string) => Promise<string>;
      }
    ).fetchAndCachePage(
      "https://www.thelatinlibrary.com/vergil/index.html",
      "https://www.thelatinlibrary.com/",
    );

    expect(result).toBe("cached html");
    expect(loggerService.log).not.toHaveBeenCalledWith(
      expect.stringContaining("Downloading"),
    );
  });

  it("should download page on cache miss and return empty string on download failure", async () => {
    readFileMock.mockRejectedValueOnce(new Error("missing"));

    vi.spyOn(
      latinLibraryCommand as unknown as {
        downloadAndSaveLatinLibraryFile: (
          parsedUrl: URL,
          targetPath: string,
        ) => Promise<string>;
      },
      "downloadAndSaveLatinLibraryFile",
    ).mockResolvedValueOnce("downloaded html");

    const firstResult = await (
      latinLibraryCommand as unknown as {
        fetchAndCachePage: (urlString: string, host: string) => Promise<string>;
      }
    ).fetchAndCachePage(
      "https://www.thelatinlibrary.com/vergil/index.html",
      "https://www.thelatinlibrary.com/",
    );

    expect(firstResult).toBe("downloaded html");
    expect(loggerService.log).toHaveBeenCalledWith(
      "📥 Downloading: https://www.thelatinlibrary.com/vergil/index.html",
    );

    readFileMock.mockRejectedValueOnce(new Error("missing"));
    vi.spyOn(
      latinLibraryCommand as unknown as {
        downloadAndSaveLatinLibraryFile: (
          parsedUrl: URL,
          targetPath: string,
        ) => Promise<string>;
      },
      "downloadAndSaveLatinLibraryFile",
    ).mockRejectedValueOnce(new Error("network error"));

    const secondResult = await (
      latinLibraryCommand as unknown as {
        fetchAndCachePage: (urlString: string, host: string) => Promise<string>;
      }
    ).fetchAndCachePage(
      "https://www.thelatinlibrary.com/ovid/index.html",
      "https://www.thelatinlibrary.com/",
    );

    expect(secondResult).toBe("");
    expect(loggerService.error).toHaveBeenCalledWith(
      "❌ Error downloading https://www.thelatinlibrary.com/ovid/index.html: Error: network error",
    );
  });

  it("should process link and enqueue only allowed in-host urls", () => {
    const enqueue = vi.fn<(url: string) => void>();

    const processLink = (
      latinLibraryCommand as unknown as {
        processLink: (
          href: string,
          baseUrl: string,
          enqueue: (url: string) => void,
        ) => void;
      }
    ).processLink.bind(latinLibraryCommand);

    processLink(
      "index.html",
      "https://www.thelatinlibrary.com/vergil/",
      enqueue,
    );
    processLink(
      "mailto:hi@example.com",
      "https://www.thelatinlibrary.com/vergil/",
      enqueue,
    );
    processLink(
      "https://example.com/outside.html",
      "https://www.thelatinlibrary.com/vergil/",
      enqueue,
    );
    processLink("/ll1/skip.html", "https://www.thelatinlibrary.com/", enqueue);
    processLink(
      "aeneid.html",
      "https://www.thelatinlibrary.com/vergil/",
      enqueue,
    );

    expect(enqueue).toHaveBeenCalledTimes(1);
    expect(enqueue).toHaveBeenCalledWith(
      "https://www.thelatinlibrary.com/vergil/aeneid.html",
    );
  });

  it("should process queue url and append error log on failure", async () => {
    const fetchAndCachePageSpy = vi
      .spyOn(
        latinLibraryCommand as unknown as {
          fetchAndCachePage: (
            urlString: string,
            host: string,
          ) => Promise<string>;
        },
        "fetchAndCachePage",
      )
      .mockRejectedValueOnce(new Error("queue failure"));

    await (
      latinLibraryCommand as unknown as {
        processQueueUrl: (
          urlString: string,
          host: string,
          enqueue: (url: string) => void,
        ) => Promise<void>;
      }
    ).processQueueUrl(
      "https://www.thelatinlibrary.com/vergil/",
      "https://www.thelatinlibrary.com/",
      vi.fn<(url: string) => void>(),
    );

    expect(fetchAndCachePageSpy).toHaveBeenCalledTimes(1);
    expect(loggerService.error).toHaveBeenCalledTimes(1);
    expect(appendFileMock).toHaveBeenCalledTimes(1);
  });

  it("should process queue url html and extract links", async () => {
    vi.spyOn(
      latinLibraryCommand as unknown as {
        fetchAndCachePage: (urlString: string, host: string) => Promise<string>;
      },
      "fetchAndCachePage",
    ).mockResolvedValueOnce(
      '<html><body><a href="aeneid.html">Aeneid</a></body></html>',
    );

    const enqueue = vi.fn<(url: string) => void>();

    await (
      latinLibraryCommand as unknown as {
        processQueueUrl: (
          urlString: string,
          host: string,
          enqueue: (url: string) => void,
        ) => Promise<void>;
      }
    ).processQueueUrl(
      "https://www.thelatinlibrary.com/vergil/",
      "https://www.thelatinlibrary.com/",
      enqueue,
    );

    expect(enqueue).toHaveBeenCalledWith(
      "https://www.thelatinlibrary.com/vergil/aeneid.html",
    );
  });

  it("should ignore anchors without href when parsing html links", () => {
    const enqueue = vi.fn<(url: string) => void>();

    (
      latinLibraryCommand as unknown as {
        parseHtmlForLinks: (
          html: string,
          baseUrl: string,
          enqueue: (url: string) => void,
        ) => void;
      }
    ).parseHtmlForLinks(
      '<html><body><a>no href</a><a href="aeneid.html">Aeneid</a></body></html>',
      "https://www.thelatinlibrary.com/vergil/",
      enqueue,
    );

    expect(enqueue).toHaveBeenCalledTimes(1);
    expect(enqueue).toHaveBeenCalledWith(
      "https://www.thelatinlibrary.com/vergil/aeneid.html",
    );
  });

  it("should not parse links for non-html extension queue urls", async () => {
    vi.spyOn(
      latinLibraryCommand as unknown as {
        fetchAndCachePage: (urlString: string, host: string) => Promise<string>;
      },
      "fetchAndCachePage",
    ).mockResolvedValueOnce(
      '<html><body><a href="aeneid.html">Aeneid</a></body></html>',
    );

    const parseHtmlForLinksSpy = vi.spyOn(
      latinLibraryCommand as unknown as {
        parseHtmlForLinks: (
          html: string,
          baseUrl: string,
          enqueue: (url: string) => void,
        ) => void;
      },
      "parseHtmlForLinks",
    );

    await (
      latinLibraryCommand as unknown as {
        processQueueUrl: (
          urlString: string,
          host: string,
          enqueue: (url: string) => void,
        ) => Promise<void>;
      }
    ).processQueueUrl(
      "https://www.thelatinlibrary.com/archive.pdf",
      "https://www.thelatinlibrary.com/",
      vi.fn<(url: string) => void>(),
    );

    expect(parseHtmlForLinksSpy).not.toHaveBeenCalled();
  });

  it("should return early when queue fetch returns empty html", async () => {
    vi.spyOn(
      latinLibraryCommand as unknown as {
        fetchAndCachePage: (urlString: string, host: string) => Promise<string>;
      },
      "fetchAndCachePage",
    ).mockResolvedValueOnce("");

    const parseHtmlForLinksSpy = vi.spyOn(
      latinLibraryCommand as unknown as {
        parseHtmlForLinks: (
          html: string,
          baseUrl: string,
          enqueue: (url: string) => void,
        ) => void;
      },
      "parseHtmlForLinks",
    );

    await (
      latinLibraryCommand as unknown as {
        processQueueUrl: (
          urlString: string,
          host: string,
          enqueue: (url: string) => void,
        ) => Promise<void>;
      }
    ).processQueueUrl(
      "https://www.thelatinlibrary.com/vergil/",
      "https://www.thelatinlibrary.com/",
      vi.fn<(url: string) => void>(),
    );

    expect(parseHtmlForLinksSpy).not.toHaveBeenCalled();
  });

  it("should extract author urls and flatten category urls", async () => {
    const authorUrls = (
      latinLibraryCommand as unknown as {
        getAuthorUrls: (indexHtml: string) => string[];
      }
    ).getAuthorUrls(
      '<p><table><tr><td><a href="vergil/">Vergil</a></td><td><a href="index.html">Index</a></td><td><a href="christian.html">Christian</a></td></tr></table></p>',
    );

    expect(authorUrls).toStrictEqual(["vergil/", "christian.html"]);

    vi.spyOn(
      latinLibraryCommand as unknown as {
        processCategoryHref: (
          href: string,
          host: string,
          finalAuthorUrls: string[],
        ) => Promise<void>;
      },
      "processCategoryHref",
    ).mockImplementation(async (_href, _host, finalAuthorUrls) => {
      await Promise.resolve();
      finalAuthorUrls.push("bible.html");
    });

    const finalAuthorUrls = await (
      latinLibraryCommand as unknown as {
        getFinalAuthorUrls: (
          host: string,
          authorUrls: string[],
        ) => Promise<string[]>;
      }
    ).getFinalAuthorUrls("https://www.thelatinlibrary.com/", authorUrls);

    expect(finalAuthorUrls).toStrictEqual(["vergil/", "bible.html"]);
  });

  it("should enqueue author urls with trailing slash normalization", () => {
    const queue: string[] = [];

    (
      latinLibraryCommand as unknown as {
        enqueueAuthorUrls: (
          finalAuthorUrls: string[],
          host: string,
          enqueue: (url: string) => void,
        ) => void;
      }
    ).enqueueAuthorUrls(
      ["vergil", "ovid/", "catullus.html"],
      "https://www.thelatinlibrary.com/",
      (url) => {
        queue.push(url);
      },
    );

    expect(queue).toStrictEqual([
      "https://www.thelatinlibrary.com/vergil/",
      "https://www.thelatinlibrary.com/ovid/",
      "https://www.thelatinlibrary.com/catullus.html",
    ]);
  });

  it("should fix malformed Biblia Sacra link in category page", async () => {
    vi.spyOn(
      latinLibraryCommand as unknown as {
        fetchAndCachePage: (urlString: string, host: string) => Promise<string>;
      },
      "fetchAndCachePage",
    ).mockResolvedValueOnce(
      '<table><tr><td><a>Biblia Sacra</a></td><td><a href="classics.html">Skip</a></td></tr></table>',
    );

    const finalAuthorUrls: string[] = [];

    await (
      latinLibraryCommand as unknown as {
        processCategoryHref: (
          href: string,
          host: string,
          output: string[],
        ) => Promise<void>;
      }
    ).processCategoryHref(
      "christian.html",
      "https://www.thelatinlibrary.com/",
      finalAuthorUrls,
    );

    expect(finalAuthorUrls).toStrictEqual(["bible.html"]);
  });

  it("should normalize leading slash links found in category pages", async () => {
    vi.spyOn(
      latinLibraryCommand as unknown as {
        fetchAndCachePage: (urlString: string, host: string) => Promise<string>;
      },
      "fetchAndCachePage",
    ).mockResolvedValueOnce(
      '<table><tr><td><a href="/vergil.html">Vergil</a></td></tr></table>',
    );

    const finalAuthorUrls: string[] = [];

    await (
      latinLibraryCommand as unknown as {
        processCategoryHref: (
          href: string,
          host: string,
          output: string[],
        ) => Promise<void>;
      }
    ).processCategoryHref(
      "christian.html",
      "https://www.thelatinlibrary.com/",
      finalAuthorUrls,
    );

    expect(finalAuthorUrls).toStrictEqual(["vergil.html"]);
  });

  it("should append stringified non-Error failures in queue processing", async () => {
    vi.spyOn(
      latinLibraryCommand as unknown as {
        fetchAndCachePage: (urlString: string, host: string) => Promise<string>;
      },
      "fetchAndCachePage",
    ).mockRejectedValueOnce("queue failed");

    await (
      latinLibraryCommand as unknown as {
        processQueueUrl: (
          urlString: string,
          host: string,
          enqueue: (url: string) => void,
        ) => Promise<void>;
      }
    ).processQueueUrl(
      "https://www.thelatinlibrary.com/vergil/",
      "https://www.thelatinlibrary.com/",
      vi.fn<(url: string) => void>(),
    );

    expect(loggerService.error).toHaveBeenCalledWith(
      "❌ Error processing https://www.thelatinlibrary.com/vergil/: queue failed",
    );
    expect(appendFileMock).toHaveBeenCalledTimes(1);
  });

  it("should fall back to error message when stack trace is empty", async () => {
    const queueError = new Error("queue failure without stack");
    queueError.stack = "";

    vi.spyOn(
      latinLibraryCommand as unknown as {
        fetchAndCachePage: (urlString: string, host: string) => Promise<string>;
      },
      "fetchAndCachePage",
    ).mockRejectedValueOnce(queueError);

    await (
      latinLibraryCommand as unknown as {
        processQueueUrl: (
          urlString: string,
          host: string,
          enqueue: (url: string) => void,
        ) => Promise<void>;
      }
    ).processQueueUrl(
      "https://www.thelatinlibrary.com/vergil/",
      "https://www.thelatinlibrary.com/",
      vi.fn<(url: string) => void>(),
    );

    expect(appendFileMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining("queue failure without stack"),
    );
  });

  it("should download and save page content and warn on non-ok responses", async () => {
    vi.useFakeTimers();

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          text: async () => await Promise.resolve("<html>ok</html>"),
        })
        .mockResolvedValueOnce({
          ok: false,
          statusText: "Not Found",
        }),
    );

    const firstPromise = (
      latinLibraryCommand as unknown as {
        downloadAndSaveLatinLibraryFile: (
          parsedUrl: URL,
          targetPath: string,
        ) => Promise<string>;
      }
    ).downloadAndSaveLatinLibraryFile(
      new URL("https://www.thelatinlibrary.com/vergil/index.html"),
      "/tmp/vergil/index.html",
    );

    await vi.runAllTimersAsync();
    const firstResult = await firstPromise;

    const secondResult = await (
      latinLibraryCommand as unknown as {
        downloadAndSaveLatinLibraryFile: (
          parsedUrl: URL,
          targetPath: string,
        ) => Promise<string>;
      }
    ).downloadAndSaveLatinLibraryFile(
      new URL("https://www.thelatinlibrary.com/ovid/index.html"),
      "/tmp/ovid/index.html",
    );

    expect(firstResult).toBe("<html>ok</html>");
    expect(secondResult).toBe("");
    expect(mkdirMock).toHaveBeenCalledTimes(1);
    expect(writeFileMock).toHaveBeenCalledWith(
      "/tmp/vergil/index.html",
      "<html>ok</html>",
      "utf8",
    );
    expect(loggerService.warn).toHaveBeenCalledWith(
      "⚠️ Failed to fetch https://www.thelatinlibrary.com/ovid/index.html: Not Found",
    );

    vi.useRealTimers();
  });

  it("should run crawler and complete workflow", async () => {
    vi.spyOn(
      latinLibraryCommand as unknown as {
        fetchAndCachePage: (urlString: string, host: string) => Promise<string>;
      },
      "fetchAndCachePage",
    ).mockResolvedValueOnce("<html><body></body></html>");

    vi.spyOn(
      latinLibraryCommand as unknown as {
        getAuthorUrls: (indexHtml: string) => string[];
      },
      "getAuthorUrls",
    ).mockReturnValueOnce(["vergil/"]);

    vi.spyOn(
      latinLibraryCommand as unknown as {
        getFinalAuthorUrls: (
          host: string,
          authorUrls: string[],
        ) => Promise<string[]>;
      },
      "getFinalAuthorUrls",
    ).mockResolvedValueOnce(["vergil/"]);

    const processQueueUrlSpy = vi
      .spyOn(
        latinLibraryCommand as unknown as {
          processQueueUrl: (
            urlString: string,
            host: string,
            enqueue: (url: string) => void,
          ) => Promise<void>;
        },
        "processQueueUrl",
      )
      .mockResolvedValue(undefined);

    await latinLibraryCommand.run();

    expect(mkdirMock).toHaveBeenCalledTimes(1);
    expect(processQueueUrlSpy).toHaveBeenCalledTimes(1);
    expect(loggerService.log).toHaveBeenCalledWith(
      "✅ Finished scraping The Latin Library.",
    );
  });

  it("should process duplicated author urls only once in run queue", async () => {
    vi.spyOn(
      latinLibraryCommand as unknown as {
        fetchAndCachePage: (urlString: string, host: string) => Promise<string>;
      },
      "fetchAndCachePage",
    ).mockResolvedValueOnce("<html><body></body></html>");

    vi.spyOn(
      latinLibraryCommand as unknown as {
        getAuthorUrls: (indexHtml: string) => string[];
      },
      "getAuthorUrls",
    ).mockReturnValueOnce(["vergil/", "vergil/"]);

    vi.spyOn(
      latinLibraryCommand as unknown as {
        getFinalAuthorUrls: (
          host: string,
          authorUrls: string[],
        ) => Promise<string[]>;
      },
      "getFinalAuthorUrls",
    ).mockResolvedValueOnce(["vergil/", "vergil/"]);

    const processQueueUrlSpy = vi
      .spyOn(
        latinLibraryCommand as unknown as {
          processQueueUrl: (
            urlString: string,
            host: string,
            enqueue: (url: string) => void,
          ) => Promise<void>;
        },
        "processQueueUrl",
      )
      .mockResolvedValue(undefined);

    await latinLibraryCommand.run();

    expect(processQueueUrlSpy).toHaveBeenCalledTimes(1);
    expect(processQueueUrlSpy).toHaveBeenCalledWith(
      "https://www.thelatinlibrary.com/vergil/",
      "https://www.thelatinlibrary.com/",
      expect.any(Function),
    );
  });
});
