import { Test } from "@nestjs/testing";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LoggerModule } from "../logger/logger.module";
import { LoggerService } from "../logger/logger.service";

import { PerseusCommand } from "./perseus.command";

describe("PerseusCommand", () => {
  let command: PerseusCommand;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        PerseusCommand,
        { provide: LoggerService, useValue: createLoggerServiceMock() },
      ],
    }).compile();

    command = await module.resolve(PerseusCommand);
  });

  it("is defined", () => {
    expect(command).toBeDefined();
  });
});

const { accessMock, appendFileMock, mkdirMock, writeFileMock } = vi.hoisted(
  () => ({
    accessMock: vi.fn(),
    appendFileMock: vi.fn(),
    mkdirMock: vi.fn(),
    writeFileMock: vi.fn(),
  }),
);

vi.mock("node:fs/promises", () => ({
  access: accessMock,
  appendFile: appendFileMock,
  mkdir: mkdirMock,
  writeFile: writeFileMock,
}));

interface FetchJsonResponse {
  tree: { path: string; type: string }[];
}

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

describe("PerseusCommand", () => {
  let perseusCommand: PerseusCommand;

  const loggerService = {
    error: vi.fn(),
    log: vi.fn(),
    setContext: vi.fn(),
    warn: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    accessMock.mockResolvedValue(undefined);
    appendFileMock.mockResolvedValue(undefined);
    mkdirMock.mockResolvedValue(undefined);
    writeFileMock.mockResolvedValue(undefined);

    const moduleRef = await Test.createTestingModule({
      providers: [
        PerseusCommand,
        { provide: LoggerService, useValue: loggerService },
      ],
    }).compile();

    perseusCommand = await moduleRef.resolve(PerseusCommand);
  });

  it("is defined", () => {
    expect(perseusCommand).toBeDefined();
    expect(loggerService.setContext).toHaveBeenCalledWith("PerseusCommand");
  });

  it("should return null and log error when tree fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          await Promise.resolve({ ok: false, statusText: "Not Found" }),
      ),
    );

    const result = await (
      perseusCommand as unknown as {
        fetchSourceXmlPaths: () => Promise<null | string[]>;
      }
    ).fetchSourceXmlPaths();

    expect(result).toBeNull();
    expect(loggerService.error).toHaveBeenCalledWith(
      "❌ Failed to fetch Perseus tree: Not Found",
    );
  });

  it("should filter and return only latin xml blob paths", async () => {
    const jsonResponse: FetchJsonResponse = {
      tree: [
        { path: "a/file-lat.xml", type: "blob" },
        { path: "a/file-greek.xml", type: "blob" },
        { path: "a/file-lat.txt", type: "blob" },
        { path: "a/dir", type: "tree" },
      ],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          await Promise.resolve({
            json: async () => await Promise.resolve(jsonResponse),
            ok: true,
          }),
      ),
    );

    const result = await (
      perseusCommand as unknown as {
        fetchSourceXmlPaths: () => Promise<null | string[]>;
      }
    ).fetchSourceXmlPaths();

    expect(result).toEqual(["a/file-lat.xml"]);
  });

  it("should append error log details", async () => {
    await (
      perseusCommand as unknown as {
        appendSourceDownloadErrorLog: (
          xmlPath: string,
          error: unknown,
        ) => Promise<void>;
      }
    ).appendSourceDownloadErrorLog("a/file-lat.xml", new Error("boom"));

    expect(loggerService.error).toHaveBeenCalledWith(
      "❌ Error downloading a/file-lat.xml: Error: boom",
    );
    expect(appendFileMock).toHaveBeenCalledTimes(1);
  });

  it("should skip existing xml files", async () => {
    accessMock.mockResolvedValue(undefined);

    await (
      perseusCommand as unknown as {
        downloadSourceXmlFileIfMissing: (xmlPath: string) => Promise<void>;
      }
    ).downloadSourceXmlFileIfMissing("a/file-lat.xml");

    expect(loggerService.log).toHaveBeenCalledWith(
      "⏭️ Skipping already downloaded: a/file-lat.xml",
    );
  });

  it("should call fetch writer for missing xml files", async () => {
    accessMock.mockRejectedValue(new Error("missing"));

    const fetchAndWriteSpy = vi
      .spyOn(
        perseusCommand as unknown as {
          fetchAndWriteXmlFile: (
            fileUrl: string,
            targetPath: string,
          ) => Promise<void>;
        },
        "fetchAndWriteXmlFile",
      )
      .mockResolvedValue(undefined);

    await (
      perseusCommand as unknown as {
        downloadSourceXmlFileIfMissing: (xmlPath: string) => Promise<void>;
      }
    ).downloadSourceXmlFileIfMissing("a/file-lat.xml");

    expect(mkdirMock).toHaveBeenCalledTimes(1);
    expect(fetchAndWriteSpy).toHaveBeenCalledTimes(1);
  });

  it("should append download error log when xml fetch/write fails", async () => {
    accessMock.mockRejectedValue(new Error("missing"));

    vi.spyOn(
      perseusCommand as unknown as {
        fetchAndWriteXmlFile: (
          fileUrl: string,
          targetPath: string,
        ) => Promise<void>;
      },
      "fetchAndWriteXmlFile",
    ).mockRejectedValue(new Error("network failure"));

    const appendErrorSpy = vi
      .spyOn(
        perseusCommand as unknown as {
          appendSourceDownloadErrorLog: (
            xmlPath: string,
            error: unknown,
          ) => Promise<void>;
        },
        "appendSourceDownloadErrorLog",
      )
      .mockResolvedValue(undefined);

    await (
      perseusCommand as unknown as {
        downloadSourceXmlFileIfMissing: (xmlPath: string) => Promise<void>;
      }
    ).downloadSourceXmlFileIfMissing("a/file-lat.xml");

    expect(appendErrorSpy).toHaveBeenCalledWith(
      "a/file-lat.xml",
      expect.any(Error),
    );
  });

  it("should warn and return on non-ok xml fetch", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          await Promise.resolve({ ok: false, statusText: "Forbidden" }),
      ),
    );

    await (
      perseusCommand as unknown as {
        fetchAndWriteXmlFile: (
          fileUrl: string,
          targetPath: string,
        ) => Promise<void>;
      }
    ).fetchAndWriteXmlFile("https://example.com/file.xml", "/tmp/file.xml");

    expect(loggerService.warn).toHaveBeenCalledWith(
      "⚠️ Failed to fetch https://example.com/file.xml: Forbidden",
    );
    expect(writeFileMock).not.toHaveBeenCalled();
  });

  it("should write xml content on successful fetch", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          await Promise.resolve({
            ok: true,
            text: async () => await Promise.resolve("<xml/>"),
          }),
      ),
    );

    const writePromise = (
      perseusCommand as unknown as {
        fetchAndWriteXmlFile: (
          fileUrl: string,
          targetPath: string,
        ) => Promise<void>;
      }
    ).fetchAndWriteXmlFile("https://example.com/file.xml", "/tmp/file.xml");

    await vi.advanceTimersByTimeAsync(101);
    await writePromise;

    expect(writeFileMock).toHaveBeenCalledWith(
      "/tmp/file.xml",
      "<xml/>",
      "utf8",
    );
    vi.useRealTimers();
  });

  it("should return early from run when xml paths are null", async () => {
    vi.spyOn(
      perseusCommand as unknown as {
        fetchSourceXmlPaths: () => Promise<null | string[]>;
      },
      "fetchSourceXmlPaths",
    ).mockResolvedValue(null);

    const downloadSpy = vi.spyOn(
      perseusCommand as unknown as {
        downloadSourceXmlFileIfMissing: (xmlPath: string) => Promise<void>;
      },
      "downloadSourceXmlFileIfMissing",
    );

    await perseusCommand.run();

    expect(downloadSpy).not.toHaveBeenCalled();
  });

  it("should process every discovered xml path in run", async () => {
    vi.spyOn(
      perseusCommand as unknown as {
        fetchSourceXmlPaths: () => Promise<null | string[]>;
      },
      "fetchSourceXmlPaths",
    ).mockResolvedValue(["a/file-lat.xml", "b/other-lat.xml"]);

    const downloadSpy = vi
      .spyOn(
        perseusCommand as unknown as {
          downloadSourceXmlFileIfMissing: (xmlPath: string) => Promise<void>;
        },
        "downloadSourceXmlFileIfMissing",
      )
      .mockResolvedValue(undefined);

    await perseusCommand.run();

    expect(mkdirMock).toHaveBeenCalledTimes(1);
    expect(downloadSpy).toHaveBeenCalledTimes(2);
    expect(downloadSpy).toHaveBeenNthCalledWith(1, "a/file-lat.xml");
    expect(downloadSpy).toHaveBeenNthCalledWith(2, "b/other-lat.xml");
  });
});
