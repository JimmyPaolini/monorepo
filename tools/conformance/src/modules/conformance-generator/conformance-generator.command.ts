import { Injectable } from "@nestjs/common";
import { DiscoveryService } from "@nestjs/core";
import { Command, CommandRunner, Option } from "nest-commander";
import prompts from "prompts";

import { LoggerService } from "../logger/logger.service";

import type { Choice, PromptObject } from "prompts";

const COMMAND_METADATA_KEY = "CommandBuilder:Command:Meta";

/** Command metadata read from nest-commander providers. */
interface CommandMetadata {
  description?: string;
  name: string;
}

/** Provider payload returned by Nest discovery. */
interface DiscoveredProvider {
  instance: unknown;
  metatype: unknown;
}

/** Generator command provider and resolved command metadata. */
interface RegisteredGeneratorCommand {
  description?: string;
  name: string;
  runner: CommandRunner;
}

/**
 * CLI entry point for conformance.
 */
@Command({
  description: "Run the conformance command-line application",
  name: "conformance",
})
@Injectable()
export class ConformanceGeneratorCommand extends CommandRunner {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly logger: LoggerService,
  ) {
    super();
    this.logger.setContext(ConformanceGeneratorCommand.name);
  }

  /**
   * Prompts the user to choose a registered generator command.
   */
  private async promptGeneratorCommand(
    commands: RegisteredGeneratorCommand[],
  ): Promise<RegisteredGeneratorCommand> {
    const request: PromptObject<"commandName"> = {
      choices: commands.map(
        (command): Choice => ({
          title:
            command.description === undefined
              ? command.name
              : `${command.name} — ${command.description}`,
          value: command.name,
        }),
      ),
      message: "Which generator command would you like to run?",
      name: "commandName",
      type: "select",
    };
    const response: { commandName: string | undefined } =
      await prompts(request);
    const selectedCommand = commands.find((command) => {
      return command.name === response.commandName;
    });
    if (selectedCommand === undefined) {
      throw new Error("No generator command selected");
    }

    return selectedCommand;
  }

  /**
   * Resolves every registered generator command from Nest provider metadata.
   */
  private resolveRegisteredGeneratorCommands(): RegisteredGeneratorCommand[] {
    const discoveredProviders = this.discoveryService.getProviders() as
      | DiscoveredProvider[]
      | undefined;
    const providerCommands = (discoveredProviders ?? []).flatMap(
      (provider): RegisteredGeneratorCommand[] => {
        const metatype = provider.metatype;
        const instance = provider.instance;
        if (
          typeof metatype !== "function" ||
          !(instance instanceof CommandRunner)
        ) {
          return [];
        }

        const metadata = Reflect.getMetadata(COMMAND_METADATA_KEY, metatype) as
          | CommandMetadata
          | undefined;
        if (!metadata?.name.endsWith("-generator")) {
          return [];
        }

        return [
          {
            name: metadata.name,
            runner: instance,
            ...(metadata.description === undefined
              ? {}
              : { description: metadata.description }),
          },
        ];
      },
    );

    const commandByName = new Map<string, RegisteredGeneratorCommand>();
    for (const command of providerCommands) {
      commandByName.set(command.name, command);
    }

    return [...commandByName.values()].toSorted((a, b) => {
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Parses the command option from CLI flags.
   */
  @Option({
    description: "Generator command to run",
    flags: "-c, --command <command>",
  })
  parseCommand(value: string): string {
    return value;
  }

  /**
   * Prompts for a generator command and runs it.
   */
  async run(
    _passedParameter: string[],
    options?: { command?: string },
  ): Promise<void> {
    const generatorCommands = this.resolveRegisteredGeneratorCommands();
    if (generatorCommands.length === 0) {
      throw new Error(
        "No generator commands are registered in the application",
      );
    }

    const selectedCommand = options?.command
      ? ((): RegisteredGeneratorCommand => {
          const cmd = generatorCommands.find((c) => c.name === options.command);
          if (!cmd) {
            throw new Error(`Generator command "${options.command}" not found`);
          }
          return cmd;
        })()
      : await this.promptGeneratorCommand(generatorCommands);
    this.logger.log(`Running ${selectedCommand.name}`);
    await selectedCommand.runner.run([], {});
  }
}
