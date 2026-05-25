import { Injectable } from "@nestjs/common";
import { Command, CommandRunner } from "nest-commander";

/**
 * CLI entry point for {{nameKebab}}.
 */
@Injectable()
@Command({
  name: "{{nameKebab}}",
  description: "Run the {{nameKebab}} command-line application",
})
export class {{namePascalCase}}Command extends CommandRunner {
  constructor() {
    super();
  }

  async run(): Promise<void> {
    // 🌱 Implement command behavior
  }
}
