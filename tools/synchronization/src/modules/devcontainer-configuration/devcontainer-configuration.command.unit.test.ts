import { writeFileSync } from "node:fs";
import path from "node:path";

import { createMock } from "@golevelup/ts-vitest";
import { Test } from "@nestjs/testing";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LoggerService } from "../logger/logger.service";

import { DevcontainerConfigurationCommand } from "./devcontainer-configuration.command";

const fileContents = new Map<string, string>();

vi.mock("node:fs", () => {
  return {
    readFileSync: vi.fn((filePath: string): string => {
      const value = fileContents.get(filePath);
      if (value === undefined) {
        throw new Error(`File not found: ${filePath}`);
      }
      return value;
    }),
    writeFileSync: vi.fn((filePath: string, content: string): void => {
      fileContents.set(filePath, content);
    }),
  };
});

describe(DevcontainerConfigurationCommand, () => {
  let command: DevcontainerConfigurationCommand;
  let logger: LoggerService;

  const workspaceRoot = process.cwd();
  const localConfigFile = path.join(
    workspaceRoot,
    ".devcontainer/local/devcontainer.json",
  );
  const cloudConfigFile = path.join(
    workspaceRoot,
    ".devcontainer/cloud/devcontainer.json",
  );

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DevcontainerConfigurationCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    command = await module.resolve(DevcontainerConfigurationCommand);
    logger = await module.resolve(LoggerService);
  });

  beforeEach(() => {
    fileContents.clear();
    vi.clearAllMocks();
  });

  it("is defined", () => {
    expect(command).toBeDefined();
  });

  it("sets logger context", async () => {
    const module = await Test.createTestingModule({
      providers: [
        DevcontainerConfigurationCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
      ],
    }).compile();

    const logger = await module.resolve(LoggerService);

    expect(logger.setContext).toHaveBeenCalledWith(
      "DevcontainerConfigurationCommand",
    );
  });

  it("passes check mode when cloud config is already synchronized", async () => {
    const localConfig = {
      $schema: "schema",
      features: {
        "ghcr.io/devcontainers/features/node:1": {},
      },
      remoteEnv: {
        APP_ENVIRONMENT: "local",
      },
    };
    const cloudConfig = {
      $schema: "schema",
      features: {
        "ghcr.io/devcontainers/features/node:1": {},
      },
      mounts: ["source=/cache,target=/cache,type=volume"],
      remoteEnv: {
        APP_ENVIRONMENT: "local",
      },
    };

    fileContents.set(localConfigFile, JSON.stringify(localConfig));
    fileContents.set(cloudConfigFile, JSON.stringify(cloudConfig));

    await command.run(["check"]);

    expect(logger.log).toHaveBeenCalledWith(
      "✅ Cloud devcontainer config is in sync with local config",
    );
    expect(writeFileSync).not.toHaveBeenCalled();
  });

  it("ignores cloud-only key differences in check mode by defaulting to check", async () => {
    fileContents.set(
      localConfigFile,
      JSON.stringify({
        $schema: "schema",
        features: {},
      }),
    );
    fileContents.set(
      cloudConfigFile,
      JSON.stringify({
        $schema: "schema",
        features: {},
        mounts: ["different"],
      }),
    );

    await command.run([]);

    expect(logger.log).toHaveBeenCalledWith(
      "✅ Cloud devcontainer config is in sync with local config",
    );
  });

  it("writes synchronized cloud config in write mode", async () => {
    const localConfig = {
      $schema: "schema",
      customizations: { vscode: { settings: { "editor.tabSize": 2 } } },
      features: {
        "ghcr.io/devcontainers/features/common-utils:2": {},
      },
      remoteEnv: {
        APP_ENVIRONMENT: "local",
        MONOREPO_ENVIRONMENT: "local",
      },
    };
    const cloudConfig = {
      $schema: "old-schema",
      features: {
        "ghcr.io/devcontainers/features/docker-in-docker:2": {},
      },
      mounts: ["source=/cache,target=/cache,type=volume"],
      remoteEnv: {
        APP_ENVIRONMENT: "cloud",
        MONOREPO_ENVIRONMENT: "cloud",
      },
    };

    fileContents.set(localConfigFile, JSON.stringify(localConfig));
    fileContents.set(cloudConfigFile, JSON.stringify(cloudConfig));

    await command.run(["write"]);

    expect(writeFileSync).toHaveBeenCalledTimes(1);
    expect(writeFileSync).toHaveBeenCalledWith(
      cloudConfigFile,
      expect.stringContaining(
        '"ghcr.io/devcontainers/features/docker-in-docker:2"',
      ),
      "utf8",
    );
    expect(writeFileSync).toHaveBeenCalledWith(
      cloudConfigFile,
      expect.stringContaining('"MONOREPO_ENVIRONMENT": "cloud"'),
      "utf8",
    );
    expect(logger.log).toHaveBeenCalledWith(
      "✅ Cloud devcontainer config updated from local config",
    );
  });

  it("skips docker features from local config during write sync", async () => {
    fileContents.set(
      localConfigFile,
      JSON.stringify({
        $schema: "schema",
        features: {
          "ghcr.io/devcontainers/features/docker-in-docker:2": {
            source: "local",
          },
        },
      }),
    );
    fileContents.set(
      cloudConfigFile,
      JSON.stringify({
        $schema: "schema",
        features: {
          "ghcr.io/devcontainers/features/docker-in-docker:2": {
            source: "cloud",
          },
        },
      }),
    );

    await command.run(["write"]);

    expect(writeFileSync).toHaveBeenCalledWith(
      cloudConfigFile,
      expect.stringContaining('"source": "cloud"'),
      "utf8",
    );
  });

  it("reports drift and exits in check mode when configs differ", async () => {
    fileContents.set(
      localConfigFile,
      JSON.stringify({
        $schema: "schema",
        remoteEnv: { APP_ENVIRONMENT: "local" },
      }),
    );
    fileContents.set(
      cloudConfigFile,
      JSON.stringify({
        $schema: "different-schema",
        remoteEnv: { APP_ENVIRONMENT: "cloud" },
      }),
    );

    const processExitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: null | number | string) => {
        throw new Error(`process.exit:${code ?? 0}`);
      });

    await expect(command.run(["check"])).rejects.toThrow("process.exit:1");

    expect(logger.log).toHaveBeenCalledWith(
      expect.stringContaining(
        "has common fields out of sync with local config",
      ),
    );
    expect(logger.log).toHaveBeenCalledWith(
      "  Run: nx run synchronization:sync-devcontainer-configuration:write",
    );

    processExitSpy.mockRestore();
  });

  it("skips reporting cloud-only keys when other fields are out of sync", async () => {
    fileContents.set(
      localConfigFile,
      JSON.stringify({
        $schema: "schema",
        remoteEnv: { APP_ENVIRONMENT: "local" },
      }),
    );
    fileContents.set(
      cloudConfigFile,
      JSON.stringify({
        $schema: "different-schema",
        mounts: ["source=/cache,target=/cache,type=volume"],
        remoteEnv: { APP_ENVIRONMENT: "cloud" },
      }),
    );

    const processExitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: null | number | string) => {
        throw new Error(`process.exit:${code ?? 0}`);
      });

    await expect(command.run(["check"])).rejects.toThrow("process.exit:1");

    expect(logger.log).not.toHaveBeenCalledWith(
      expect.stringContaining("mounts"),
    );

    processExitSpy.mockRestore();
  });

  it("exits on invalid mode", async () => {
    fileContents.set(localConfigFile, JSON.stringify({}));
    fileContents.set(cloudConfigFile, JSON.stringify({}));

    const processExitSpy = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: null | number | string) => {
        throw new Error(`process.exit:${code ?? 0}`);
      });

    await expect(command.run(["invalid-mode"])).rejects.toThrow(
      "process.exit:1",
    );

    expect(logger.error).toHaveBeenCalledWith("❌ Invalid mode: invalid-mode");
    expect(logger.error).toHaveBeenCalledWith(
      "💡 Usage: nx run synchronization:sync-devcontainer-configuration [check|write]",
    );

    processExitSpy.mockRestore();
  });
});
