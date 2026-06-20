import { Test } from "@nestjs/testing";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LoggerModule } from "../logger/logger.module";
import { LoggerService } from "../logger/logger.service";

import { CorpusScriptorumEcclesiasticorumLatinorumCommand } from "./corpus-scriptorum-ecclesiasticorum-latinorum.command";

describe("CorpusScriptorumEcclesiasticorumLatinorumCommand", () => {
  let command: CorpusScriptorumEcclesiasticorumLatinorumCommand;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [LoggerModule],
      providers: [
        CorpusScriptorumEcclesiasticorumLatinorumCommand,
        {
          provide: LoggerService,
          useValue: createLoggerServiceMock(),
        },
      ],
    }).compile();

    command = await module.resolve(
      CorpusScriptorumEcclesiasticorumLatinorumCommand,
    );
  });

  it("is defined", () => {
    expect(command).toBeDefined();
  });
});

const {
  accessMock,
  appendFileMock,
  existsSyncMock,
  mkdirMock,
  mkdirSyncMock,
  writeFileMock,
} = vi.hoisted(() => ({
  accessMock: vi.fn(),
  appendFileMock: vi.fn(),
  existsSyncMock: vi.fn(),
  mkdirMock: vi.fn(),
  mkdirSyncMock: vi.fn(),
  writeFileMock: vi.fn(),
}));

vi.mock("node:fs", () => ({
  existsSync: existsSyncMock,
  mkdirSync: mkdirSyncMock,
}));

vi.mock("node:fs/promises", () => ({
  access: accessMock,
  appendFile: appendFileMock,
  mkdir: mkdirMock,
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

describe("CorpusScriptorumEcclesiasticorumLatinorumCommand", () => {
  let command: CorpusScriptorumEcclesiasticorumLatinorumCommand;

  const loggerService = {
    error: vi.fn(),
    log: vi.fn(),
    setContext: vi.fn(),
    warn: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    existsSyncMock.mockReturnValue(true);
    mkdirMock.mockResolvedValue(undefined);
    appendFileMock.mockResolvedValue(undefined);
    writeFileMock.mockResolvedValue(undefined);

    const moduleRef = await Test.createTestingModule({
      providers: [
        CorpusScriptorumEcclesiasticorumLatinorumCommand,
        {
          provide: LoggerService,
          useValue: loggerService,
        },
      ],
    }).compile();

    command = await moduleRef.resolve(
      CorpusScriptorumEcclesiasticorumLatinorumCommand,
    );
  });

  it("is defined", () => {
    expect(command).toBeDefined();
    expect(loggerService.setContext).toHaveBeenCalledWith(
      "CorpusScriptorumEcclesiasticorumLatinorumCommand",
    );
  });

  it("should create output directory when it does not exist", async () => {
    existsSyncMock.mockReturnValue(false);

    const moduleRef = await Test.createTestingModule({
      providers: [
        CorpusScriptorumEcclesiasticorumLatinorumCommand,
        {
          provide: LoggerService,
          useValue: loggerService,
        },
      ],
    }).compile();

    await moduleRef.resolve(CorpusScriptorumEcclesiasticorumLatinorumCommand);

    expect(mkdirSyncMock).toHaveBeenCalledWith(expect.any(String), {
      recursive: true,
    });
  });

  it("should fetch tree and return null on response failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          await Promise.resolve({
            ok: false,
            statusText: "Bad Request",
          }),
      ),
    );

    const result = await (
      command as unknown as {
        fetchTree: (
          treeUrl: string,
        ) => Promise<null | { path: string; type: string }[]>;
      }
    ).fetchTree("https://example.com/tree");

    expect(result).toBeNull();
    expect(loggerService.error).toHaveBeenCalledWith(
      "❌ Failed to fetch CSEL tree: Bad Request",
    );
  });

  it("should fetch tree and return nodes on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          await Promise.resolve({
            json: async () =>
              await Promise.resolve({
                tree: [
                  { path: "data/foo.xml", type: "blob" },
                  { path: "README.md", type: "blob" },
                ],
              }),
            ok: true,
          }),
      ),
    );

    const result = await (
      command as unknown as {
        fetchTree: (
          treeUrl: string,
        ) => Promise<null | { path: string; type: string }[]>;
      }
    ).fetchTree("https://example.com/tree");

    expect(result).toEqual([
      { path: "data/foo.xml", type: "blob" },
      { path: "README.md", type: "blob" },
    ]);
  });

  it("should fetch and write xml file on successful response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          await Promise.resolve({
            ok: true,
            text: async () => await Promise.resolve("<xml>ok</xml>"),
          }),
      ),
    );

    await (
      command as unknown as {
        fetchAndWriteXmlFile: (
          fileUrl: string,
          targetPath: string,
        ) => Promise<void>;
      }
    ).fetchAndWriteXmlFile("https://example.com/file.xml", "/tmp/file.xml");

    expect(writeFileMock).toHaveBeenCalledWith(
      "/tmp/file.xml",
      "<xml>ok</xml>",
      "utf8",
    );
  });

  it("should warn and skip write on failed xml response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          await Promise.resolve({
            ok: false,
            statusText: "Not Found",
          }),
      ),
    );

    await (
      command as unknown as {
        fetchAndWriteXmlFile: (
          fileUrl: string,
          targetPath: string,
        ) => Promise<void>;
      }
    ).fetchAndWriteXmlFile("https://example.com/file.xml", "/tmp/file.xml");

    expect(loggerService.warn).toHaveBeenCalledWith(
      "⚠️ Failed to fetch https://example.com/file.xml: Not Found",
    );
    expect(writeFileMock).not.toHaveBeenCalled();
  });

  it("should skip download when xml file already exists", async () => {
    accessMock.mockResolvedValueOnce(undefined);

    await (
      command as unknown as {
        downloadSourceXmlFileIfMissing: (xmlPath: string) => Promise<void>;
      }
    ).downloadSourceXmlFileIfMissing("data/author/work.xml");

    expect(loggerService.log).toHaveBeenCalledWith(
      "⏭️ Skipping already downloaded: data/author/work.xml",
    );
  });

  it("should download missing xml file and log errors on failure", async () => {
    accessMock.mockRejectedValueOnce(new Error("missing"));

    const fetchAndWriteXmlFileSpy = vi
      .spyOn(
        command as unknown as {
          fetchAndWriteXmlFile: (
            fileUrl: string,
            targetPath: string,
          ) => Promise<void>;
        },
        "fetchAndWriteXmlFile",
      )
      .mockRejectedValueOnce(new Error("network"));

    await (
      command as unknown as {
        downloadSourceXmlFileIfMissing: (xmlPath: string) => Promise<void>;
      }
    ).downloadSourceXmlFileIfMissing("data/author/work.xml");

    expect(mkdirMock).toHaveBeenCalledTimes(1);
    expect(fetchAndWriteXmlFileSpy).toHaveBeenCalledTimes(1);
    expect(loggerService.error).toHaveBeenCalledTimes(1);
    expect(appendFileMock).toHaveBeenCalledTimes(1);
  });

  it("should stringify non-Error failures when download throws", async () => {
    accessMock.mockRejectedValueOnce(new Error("missing"));

    vi.spyOn(
      command as unknown as {
        fetchAndWriteXmlFile: (
          fileUrl: string,
          targetPath: string,
        ) => Promise<void>;
      },
      "fetchAndWriteXmlFile",
    ).mockRejectedValueOnce("network-failure");

    await (
      command as unknown as {
        downloadSourceXmlFileIfMissing: (xmlPath: string) => Promise<void>;
      }
    ).downloadSourceXmlFileIfMissing("data/author/work.xml");

    expect(loggerService.error).toHaveBeenCalledWith(
      "❌ Error downloading data/author/work.xml: network-failure",
    );
    expect(appendFileMock).toHaveBeenCalledTimes(1);
  });

  it("should run and download only eligible xml tree entries", async () => {
    vi.spyOn(
      command as unknown as {
        fetchTree: (
          treeUrl: string,
        ) => Promise<null | { path: string; type: string }[]>;
      },
      "fetchTree",
    ).mockResolvedValueOnce([
      { path: "data/author/work.xml", type: "blob" },
      { path: "data/author/__cts__.xml", type: "blob" },
      { path: "docs/readme.txt", type: "blob" },
      { path: "data/author/subfolder", type: "tree" },
    ]);

    const downloadSpy = vi
      .spyOn(
        command as unknown as {
          downloadSourceXmlFileIfMissing: (xmlPath: string) => Promise<void>;
        },
        "downloadSourceXmlFileIfMissing",
      )
      .mockResolvedValue(undefined);

    await command.run();

    expect(mkdirMock).toHaveBeenCalledTimes(1);
    expect(downloadSpy).toHaveBeenCalledTimes(1);
    expect(downloadSpy).toHaveBeenCalledWith("data/author/work.xml");
    expect(loggerService.log).toHaveBeenCalledWith(
      "✅ Finished downloading CSEL source files.",
    );
  });

  it("should return early when tree fetch fails in run", async () => {
    vi.spyOn(
      command as unknown as {
        fetchTree: (
          treeUrl: string,
        ) => Promise<null | { path: string; type: string }[]>;
      },
      "fetchTree",
    ).mockResolvedValueOnce(null);

    const downloadSpy = vi.spyOn(
      command as unknown as {
        downloadSourceXmlFileIfMissing: (xmlPath: string) => Promise<void>;
      },
      "downloadSourceXmlFileIfMissing",
    );

    await command.run();

    expect(downloadSpy).not.toHaveBeenCalled();
  });
});
