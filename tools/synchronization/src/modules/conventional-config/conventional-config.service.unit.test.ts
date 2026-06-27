import path from "node:path";

import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LoggerService } from "../logger/logger.service";

import { ConventionalConfigIoService } from "./conventional-config-io.service";
import { ConventionalConfigValidatorsService } from "./conventional-config-validators.service";
import { ConventionalConfigConstantsService } from "./conventional-config.constants";
import { ConventionalConfigService } from "./conventional-config.service";

import type {
  ConventionalConfig,
  ReleaseConfig,
  SyncContext,
} from "./conventional-config.types";

const fileContents = new Map<string, string>();
const requiredModules = new Map<string, unknown>();

vi.mock("node:fs", () => {
  return {
    readFileSync: vi.fn((filePath: string): string => {
      const value = fileContents.get(filePath);
      if (value === undefined) {
        throw new Error(`File not found: ${filePath}`);
      }
      return value;
    }),
  };
});

vi.mock("node:module", () => {
  return {
    createRequire: vi.fn(() => {
      return (modulePath: string): unknown => {
        const value = requiredModules.get(modulePath);
        if (value === undefined) {
          throw new Error(`Module not found: ${modulePath}`);
        }
        return value;
      };
    }),
  };
});

describe(ConventionalConfigService, () => {
  let constants: ConventionalConfigConstantsService;
  let io: ConventionalConfigIoService;
  let logger: LoggerService;
  let service: ConventionalConfigService;
  let validators: ConventionalConfigValidatorsService;

  const workspaceRoot = process.cwd();
  const conventionalConfigFile = path.join(
    workspaceRoot,
    "configuration/conventional.config.cjs",
  );
  const releaseConfigFile = path.join(workspaceRoot, "release.config.cjs");
  const settingsFile = path.join(workspaceRoot, ".vscode/settings.json");
  const skillFile = path.join(
    workspaceRoot,
    "documentation/skills/test/SKILL.md",
  );
  const templateFile = path.join(
    workspaceRoot,
    ".github/ISSUE_TEMPLATE/bug.yml",
  );

  const conventionalConfig: ConventionalConfig = {
    scopes: [{ description: "tools scope", name: "tools" }],
    types: [{ code: "fix", description: "fixing", emoji: "🐛", name: "fix" }],
  };
  const releaseConfig: ReleaseConfig = {
    plugins: [
      [
        "@semantic-release/commit-analyzer",
        { releaseRules: [{ release: "patch", type: "fix" }] },
      ],
      [
        "@semantic-release/release-notes-generator",
        {
          presetConfig: {
            types: [{ section: "Fixes", type: "fix" }],
          },
        },
      ],
    ],
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ConventionalConfigService,
        {
          provide: ConventionalConfigConstantsService,
          useValue: createMock<ConventionalConfigConstantsService>(),
        },
        {
          provide: ConventionalConfigIoService,
          useValue: createMock<ConventionalConfigIoService>(),
        },
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
        {
          provide: ConventionalConfigValidatorsService,
          useValue: createMock<ConventionalConfigValidatorsService>(),
        },
      ],
    }).compile();

    constants = await module.resolve(ConventionalConfigConstantsService);
    io = await module.resolve(ConventionalConfigIoService);
    logger = await module.resolve(LoggerService);
    service = await module.resolve(ConventionalConfigService);
    validators = await module.resolve(ConventionalConfigValidatorsService);

    Object.assign(constants, {
      conventionalConfigFile,
      issueTemplateFiles: [templateFile],
      releaseConfigFile,
      settingsFile,
      skillFiles: [skillFile],
    });
  });

  beforeEach(() => {
    fileContents.clear();
    requiredModules.clear();
    vi.clearAllMocks();

    requiredModules.set(conventionalConfigFile, conventionalConfig);
    requiredModules.set(releaseConfigFile, releaseConfig);
    fileContents.set(
      settingsFile,
      '{ "conventionalCommits.scopes": ["tools"] }',
    );
  });

  it("is defined", () => {
    expect(service).toBeDefined();
  });

  it("passes check mode when all validations succeed", () => {
    vi.mocked(validators.checkSettingsSync).mockReturnValue(true);
    vi.mocked(validators.checkAllSkillsSync).mockReturnValue(true);
    vi.mocked(validators.checkAllTemplatesSync).mockReturnValue(true);
    vi.mocked(validators.checkReleaseRulesSync).mockReturnValue(true);
    vi.mocked(validators.checkPresetConfigSync).mockReturnValue(true);
    vi.mocked(io.getReleaseRulesTypes).mockReturnValue(["fix"]);
    vi.mocked(io.getPresetConfigTypes).mockReturnValue(["fix"]);

    service.handleCheckMode({
      config: conventionalConfig,
      scopeNames: ["tools"],
      settingsScopes: ["tools"],
      typeNames: ["fix"],
    });

    expect(logger.log).toHaveBeenCalledWith(
      "✅ Conventional commit config is in sync",
    );
  });

  it("exits check mode when any validation fails", () => {
    vi.mocked(validators.checkSettingsSync).mockReturnValue(false);
    vi.mocked(validators.checkAllSkillsSync).mockReturnValue(true);
    vi.mocked(validators.checkAllTemplatesSync).mockReturnValue(true);
    vi.mocked(validators.checkReleaseRulesSync).mockReturnValue(true);
    vi.mocked(validators.checkPresetConfigSync).mockReturnValue(true);
    vi.mocked(io.getReleaseRulesTypes).mockReturnValue(["fix"]);
    vi.mocked(io.getPresetConfigTypes).mockReturnValue(["fix"]);

    const processExitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: null | number | string) => {
        throw new Error(`process.exit:${code ?? 0}`);
      });

    expect(() =>
      service.handleCheckMode({
        config: conventionalConfig,
        scopeNames: ["tools"],
        settingsScopes: [],
        typeNames: ["fix"],
      }),
    ).toThrow("process.exit:1");
    expect(logger.log).toHaveBeenCalledWith(
      "💡 Run 'nx run synchronization:conventional-config:write' to sync",
    );

    processExitSpy.mockRestore();
  });

  it("returns early in write mode when everything is in sync", () => {
    vi.mocked(validators.checkSettingsSync).mockReturnValue(true);
    vi.mocked(validators.checkSkillSync).mockReturnValue(true);
    vi.mocked(validators.checkIssueTemplateSync).mockReturnValue(true);

    service.handleWriteMode({
      config: conventionalConfig,
      scopeNames: ["tools"],
      settingsScopes: ["tools"],
      typeNames: ["fix"],
    });

    expect(logger.log).toHaveBeenCalledWith("✅ Already in sync");
    expect(io.writeSettingsSync).not.toHaveBeenCalled();
  });

  it("writes out-of-sync settings, skills, and templates", () => {
    vi.mocked(validators.checkSettingsSync).mockReturnValue(false);
    vi.mocked(validators.checkSkillSync).mockReturnValue(false);
    vi.mocked(validators.checkIssueTemplateSync).mockReturnValue(false);
    vi.mocked(io.getReleaseRulesTypes).mockReturnValue([]);
    vi.mocked(io.getPresetConfigTypes).mockReturnValue([]);

    service.handleWriteMode({
      config: conventionalConfig,
      scopeNames: ["tools"],
      settingsScopes: [],
      typeNames: ["fix"],
    });

    expect(io.writeSettingsSync).toHaveBeenCalledWith(
      conventionalConfig.scopes,
    );
    expect(io.writeSkillSync).toHaveBeenCalledWith(
      conventionalConfig,
      skillFile,
    );
    expect(io.writeIssueTemplateSync).toHaveBeenCalledWith(
      ["tools"],
      templateFile,
    );
    expect(io.writeReleaseConfigSync).toHaveBeenCalledWith(
      conventionalConfig.types,
    );
  });

  it("syncs release config when only preset types are missing", () => {
    vi.mocked(validators.checkSettingsSync).mockReturnValue(true);
    vi.mocked(validators.checkSkillSync).mockReturnValue(false);
    vi.mocked(validators.checkIssueTemplateSync).mockReturnValue(true);
    vi.mocked(io.getReleaseRulesTypes).mockReturnValue(["fix"]);
    vi.mocked(io.getPresetConfigTypes).mockReturnValue([]);

    service.handleWriteMode({
      config: conventionalConfig,
      scopeNames: ["tools"],
      settingsScopes: ["tools"],
      typeNames: ["fix"],
    });

    expect(io.writeReleaseConfigSync).toHaveBeenCalledWith(
      conventionalConfig.types,
    );
  });

  it("syncs release config when only release rules are missing", () => {
    vi.mocked(validators.checkSettingsSync).mockReturnValue(true);
    vi.mocked(validators.checkSkillSync).mockReturnValue(false);
    vi.mocked(validators.checkIssueTemplateSync).mockReturnValue(true);
    vi.mocked(io.getReleaseRulesTypes).mockReturnValue([]);
    vi.mocked(io.getPresetConfigTypes).mockReturnValue(["fix"]);

    service.handleWriteMode({
      config: conventionalConfig,
      scopeNames: ["tools"],
      settingsScopes: ["tools"],
      typeNames: ["fix"],
    });

    expect(io.writeReleaseConfigSync).toHaveBeenCalledWith(
      conventionalConfig.types,
    );
  });

  it("loads conventional config from CommonJS module", () => {
    expect(service.loadConventionalConfig()).toStrictEqual(conventionalConfig);
  });

  it("dispatches runSynchronization for check and write modes", () => {
    const handleCheckModeSpy = vi
      .spyOn(service, "handleCheckMode")
      .mockImplementation(() => {});
    const handleWriteModeSpy = vi
      .spyOn(service, "handleWriteMode")
      .mockImplementation(() => {});
    vi.mocked(io.parseSettingsScopes).mockReturnValue(["tools"]);

    service.runSynchronization("check");
    service.runSynchronization("write");

    expect(handleCheckModeSpy).toHaveBeenCalledWith({
      config: conventionalConfig,
      scopeNames: ["tools"],
      settingsScopes: ["tools"],
      typeNames: ["fix"],
    } satisfies SyncContext);
    expect(handleWriteModeSpy).toHaveBeenCalledWith({
      config: conventionalConfig,
      scopeNames: ["tools"],
      settingsScopes: ["tools"],
      typeNames: ["fix"],
    } satisfies SyncContext);

    handleCheckModeSpy.mockRestore();
    handleWriteModeSpy.mockRestore();
  });

  it("exits runSynchronization for invalid mode", () => {
    vi.mocked(io.parseSettingsScopes).mockReturnValue(["tools"]);

    const processExitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: null | number | string) => {
        throw new Error(`process.exit:${code ?? 0}`);
      });

    expect(() => service.runSynchronization("invalid-mode")).toThrow(
      "process.exit:1",
    );
    expect(logger.error).toHaveBeenCalledWith("❌ Invalid mode: invalid-mode");
    expect(logger.error).toHaveBeenCalledWith(
      "💡 Usage: nx run synchronization:conventional-config [check|write]",
    );

    processExitSpy.mockRestore();
  });
});
