import { Injectable } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";

import { LoggerService } from "../logger/logger.service";

/**
 * CLI entry point for {{nameKebabCase}}.
 */
@Command({
  name: "{{nameKebabCase}}",
  description: "Run the {{nameKebabCase}} command-line application",
})
@Injectable()
export class {{namePascalCase}}Command extends CommandRunner {
  constructor(private readonly logger: LoggerService) {
    super();
    this.logger.setContext({{namePascalCase}}Command.name);
  }

  async run(): Promise<void> {
    // TODO: Implement command behavior
  }
}
