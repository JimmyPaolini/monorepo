import { Injectable } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";

import { LoggerService } from "../logger/logger.service";

/**
 * CLI entry point for {{nameKebabCase}}.
 */
@Injectable()
@Command({
  name: "{{nameKebabCase}}",
  description: "Run the {{nameKebabCase}} command-line application",
})
export class {{namePascalCase}}Command extends CommandRunner {
  constructor(private readonly logger: LoggerService) {
    super();
    this.logger.setContext({{namePascalCase}}Command.name);
  }

  async run(): Promise<void> {
    // 🌱 Implement command behavior
  }
}
