import { Injectable } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";

import { LoggerService } from "../logger/logger.service";

/**
 * TODO: Document the {{nameCamelCase}} command.
 */
@Injectable()
@Command({
  description: "Run the {{nameKebabCase}} command",
  name: "{{nameKebabCase}}",
})
export class {{namePascalCase}}Command extends CommandRunner {
  // 🏗 Dependency Injection

  constructor(private readonly logger: LoggerService) {
    super();
    this.logger.setContext({{namePascalCase}}Command.name);
  }

  // 🔐 Private Fields

  // 🔑 Public Fields

  // 🔏 Private Methods

  // 🌎 Public Methods

  async run(): Promise<void> {
    // 🌱 Implement command behavior
  }
}
