import { createMock } from "@golevelup/ts-vitest";
import { Injectable } from "@nestjs/common";
import { DiscoveryService } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import { Command, CommandRunner } from "nest-commander";
import prompts from "prompts";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { LoggerService } from "../logger/logger.service";

import { ConformanceGeneratorCommand } from "./conformance-generator.command";

vi.mock("prompts", () => {
  return {
    default: vi.fn<(request: unknown) => Promise<unknown>>(),
  };
});

@Command({
  description: "Run the fake-generator command",
  name: "fake-generator",
})
@Injectable()
class FakeGeneratorCommand extends CommandRunner {
  async run(): Promise<void> {
    await Promise.resolve();
  }
}

describe(ConformanceGeneratorCommand, () => {
  let command: ConformanceGeneratorCommand;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ConformanceGeneratorCommand,
        FakeGeneratorCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
        {
          provide: DiscoveryService,
          useValue: {
            getProviders: () => {
              return [
                {
                  instance: new FakeGeneratorCommand(),
                  metatype: FakeGeneratorCommand,
                },
              ];
            },
          },
        },
      ],
    }).compile();

    command = await module.resolve(ConformanceGeneratorCommand);
  });

  beforeEach(() => {
    vi.mocked(prompts).mockReset();
  });

  it("is defined", () => {
    expect(command).toBeDefined();
  });

  it("sets logger context", async () => {
    const module = await Test.createTestingModule({
      providers: [
        ConformanceGeneratorCommand,
        FakeGeneratorCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
        {
          provide: DiscoveryService,
          useValue: {
            getProviders: () => {
              return [
                {
                  instance: new FakeGeneratorCommand(),
                  metatype: FakeGeneratorCommand,
                },
              ];
            },
          },
        },
      ],
    }).compile();

    const logger = await module.resolve(LoggerService);

    expect(logger.setContext).toHaveBeenCalledWith(
      "ConformanceGeneratorCommand",
    );
  });

  it("runs the selected generator command", async () => {
    const fakeGeneratorCommand = new FakeGeneratorCommand();
    const run = vi.spyOn(fakeGeneratorCommand, "run").mockResolvedValue();
    const module = await Test.createTestingModule({
      providers: [
        ConformanceGeneratorCommand,
        {
          provide: LoggerService,
          useValue: createMock<LoggerService>(),
        },
        {
          provide: DiscoveryService,
          useValue: {
            getProviders: () => {
              return [
                {
                  instance: fakeGeneratorCommand,
                  metatype: FakeGeneratorCommand,
                },
              ];
            },
          },
        },
      ],
    }).compile();

    const commandService = await module.resolve(ConformanceGeneratorCommand);
    vi.mocked(prompts).mockResolvedValue({
      commandName: "fake-generator",
    });

    await commandService.run([], {});

    expect(run).toHaveBeenCalledWith([], {});
  });
});
