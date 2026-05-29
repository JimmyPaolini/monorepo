import { Injectable } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";

/**
 * CLI entry point for {{nameKebabCase}}.
 */
@Injectable()
@Command({
  name: "{{nameKebabCase}}",
  description: "Run the {{nameKebabCase}} command-line application",
})
export class {{namePascalCase}}Command extends CommandRunner {
  constructor() {
    super();
  }

  async run(): Promise<void> {
    // 🌱 Implement command behavior
  }
}
