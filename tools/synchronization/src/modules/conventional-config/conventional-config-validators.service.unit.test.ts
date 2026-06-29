import path from "node:path";

import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LoggerService } from "../logger/logger.service";

import { ConventionalConfigIoService } from "./conventional-config-io.service";
import { ConventionalConfigValidatorsService } from "./conventional-config-validators.service";

import type { ConventionalConfig } from "./conventional-config.types";

const fileContents = new Map<string, string>();

vi.mock("node:fs", () => {
  return {
    readFileSync: vi.fn<(filePath: string) => string>((filePath: string) => {
      const value = fileContents.get(filePath);
      if (value === undefined) {
        throw new Error(`File not found: ${filePath}`);
      }
      return value;
    }),
  };
});

describe(ConventionalConfigValidatorsService, () => {
  let io: ConventionalConfigIoService;
  let logger: LoggerService;
  let service: ConventionalConfigValidatorsService;

  const workspaceRoot = process.cwd();
  const config: ConventionalConfig = {
    scopes: [{ description: "tools scope", name: "tools" }],
    types: [{ code: "fix", description: "fixing", emoji: "🐛", name: "fix" }],
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ConventionalConfigValidatorsService,
        {
          provide: ConventionalConfigIoService,
          useValue: createMock<ConventionalConfigIoService>(),
        },
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    io = await module.resolve(ConventionalConfigIoService);
    logger = await module.resolve(LoggerService);
    service = await module.resolve(ConventionalConfigValidatorsService);
  });

  beforeEach(() => {
    fileContents.clear();
    vi.clearAllMocks();
  });

  it("is defined", () => {
    expect(service).toBeDefined();
  });

  it("sets logger context", async () => {
    const module = await Test.createTestingModule({
      providers: [
        ConventionalConfigValidatorsService,
        {
          provide: ConventionalConfigIoService,
          useValue: createMock<ConventionalConfigIoService>(),
        },
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    const localLogger = await module.resolve(LoggerService);

    expect(localLogger.setContext).toHaveBeenCalledWith(
      "ConventionalConfigValidatorsService",
    );
  });

  it("validates matching settings scopes", () => {
    expect(service.checkSettingsSync(["tools"], ["tools"])).toBe(true);
  });

  it("detects settings scope mismatch", () => {
    expect(service.checkSettingsSync(["tools"], ["other"])).toBe(false);
    expect(logger.log).toHaveBeenCalledWith(
      "❌ settings.json scopes are out of sync\n",
    );
  });

  it("reports only missing settings values when target is subset", () => {
    expect(service.checkSettingsSync(["tools", "alpha"], ["tools"])).toBe(
      false,
    );

    expect(logger.log).toHaveBeenCalledWith(
      "  Missing in settings.json (1 items):",
    );
    expect(logger.log).not.toHaveBeenCalledWith(
      "  Extra in settings.json (1 items):",
    );
  });

  it("reports only extra settings values when target has additions", () => {
    expect(service.checkSettingsSync(["tools"], ["tools", "alpha"])).toBe(
      false,
    );

    expect(logger.log).toHaveBeenCalledWith(
      "  Extra in settings.json (1 items):",
    );
    expect(logger.log).not.toHaveBeenCalledWith(
      "  Missing in settings.json (1 items):",
    );
  });

  it("detects settings ordering drift when values match", () => {
    expect(
      service.checkSettingsSync(["tools", "alpha"], ["alpha", "tools"]),
    ).toBe(false);
    expect(logger.log).toHaveBeenCalledWith(
      "🔀 Scopes have matching values but different ordering\n",
    );
  });

  it("detects issue template scope drift and ordering drift", () => {
    const templateFile = path.join(
      workspaceRoot,
      ".github/ISSUE_TEMPLATE/bug.yml",
    );
    fileContents.set(templateFile, "template-content");
    vi.mocked(io.parseIssueTemplateScopes).mockReturnValueOnce(["other"]);

    expect(service.checkIssueTemplateSync(["tools"], templateFile)).toBe(false);

    vi.mocked(io.parseIssueTemplateScopes).mockReturnValueOnce([
      "tools",
      "alpha",
    ]);

    expect(
      service.checkIssueTemplateSync(["alpha", "tools"], templateFile),
    ).toBe(false);
  });

  it("validates issue template when scopes match exactly", () => {
    const templateFile = path.join(
      workspaceRoot,
      ".github/ISSUE_TEMPLATE/bug.yml",
    );
    fileContents.set(templateFile, "template-content");
    vi.mocked(io.parseIssueTemplateScopes).mockReturnValueOnce(["tools"]);

    expect(service.checkIssueTemplateSync(["tools"], templateFile)).toBe(true);
  });

  it("detects missing issue template markers", () => {
    const templateFile = path.join(
      workspaceRoot,
      ".github/ISSUE_TEMPLATE/bug.yml",
    );
    fileContents.set(templateFile, "template-content");
    vi.mocked(io.parseIssueTemplateScopes).mockReturnValueOnce([]);

    expect(service.checkIssueTemplateSync(["tools"], templateFile)).toBe(false);
    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining("missing <!-- scopes-start/end --> markers"),
    );
  });

  it("validates release rules and preset config drift", () => {
    expect(
      service.checkReleaseRulesSync(["fix"], ["fix"], "release.config.cjs"),
    ).toBe(true);
    expect(
      service.checkReleaseRulesSync(["fix"], [], "release.config.cjs"),
    ).toBe(false);

    expect(
      service.checkPresetConfigSync(["fix"], ["fix"], "release.config.cjs"),
    ).toBe(true);
    expect(
      service.checkPresetConfigSync(["fix"], [], "release.config.cjs"),
    ).toBe(false);
  });

  it("validates skill marker sync and missing marker handling", () => {
    const skillFile = path.join(
      workspaceRoot,
      "documentation/skills/test/SKILL.md",
    );
    fileContents.set(skillFile, "skill-content");

    vi.mocked(io.extractMarkerContent)
      .mockReturnValueOnce("| `fix` | desc |\n")
      .mockReturnValueOnce("| `tools` | desc |\n");
    vi.mocked(io.parseMarkdownTableValues)
      .mockReturnValueOnce(["fix"])
      .mockReturnValueOnce(["tools"]);

    expect(service.checkSkillSync(config, skillFile)).toBe(true);

    vi.mocked(io.extractMarkerContent)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce("| `tools` | desc |\n");
    vi.mocked(io.parseMarkdownTableValues).mockReturnValueOnce(["tools"]);

    expect(service.checkSkillSync(config, skillFile)).toBe(false);
  });

  it("detects skill marker value and ordering drift", () => {
    const skillFile = path.join(
      workspaceRoot,
      "documentation/skills/test/SKILL.md",
    );
    fileContents.set(skillFile, "skill-content");

    vi.mocked(io.extractMarkerContent)
      .mockReturnValueOnce("| `other` | desc |\n")
      .mockReturnValueOnce("| `tools` | desc |\n");
    vi.mocked(io.parseMarkdownTableValues)
      .mockReturnValueOnce(["other"])
      .mockReturnValueOnce(["tools"]);

    expect(service.checkSkillSync(config, skillFile)).toBe(false);

    vi.mocked(io.extractMarkerContent)
      .mockReturnValueOnce("| `fix` | desc |\n")
      .mockReturnValueOnce("| `alpha` | desc |\n| `tools` | desc |\n");
    vi.mocked(io.parseMarkdownTableValues)
      .mockReturnValueOnce(["fix"])
      .mockReturnValueOnce(["alpha", "tools"]);

    expect(
      service.checkSkillSync(
        {
          scopes: [
            { description: "tools scope", name: "tools" },
            { description: "alpha scope", name: "alpha" },
          ],
          types: config.types,
        },
        skillFile,
      ),
    ).toBe(false);
  });

  it("aggregates all skills and templates validation", () => {
    const skillFile = path.join(
      workspaceRoot,
      "documentation/skills/test/SKILL.md",
    );
    const templateFile = path.join(
      workspaceRoot,
      ".github/ISSUE_TEMPLATE/bug.yml",
    );

    const checkSkillSyncSpy = vi
      .spyOn(service, "checkSkillSync")
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);

    expect(service.checkAllSkillsSync(config, [skillFile, skillFile])).toBe(
      false,
    );

    checkSkillSyncSpy.mockRestore();

    const checkIssueTemplateSyncSpy = vi
      .spyOn(service, "checkIssueTemplateSync")
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);

    expect(
      service.checkAllTemplatesSync(["tools"], [templateFile, templateFile]),
    ).toBe(false);

    checkIssueTemplateSyncSpy.mockRestore();
  });
});
