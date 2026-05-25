import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Command, CommandRunner } from "nest-commander";

import type { Environment } from "./{{nameCamelCase}}.types";

/**
 * CLI entry point for {{nameKebab}}.
 */
@Injectable()
@Command({
  name: "{{nameKebab}}",
  description: "Run the {{nameKebab}} command-line application",
})
export class {{namePascalCase}}Command extends CommandRunner {
  constructor(
    @Inject(ConfigService)
    private readonly configService: ConfigService<Environment>,
  ) {
    super();
  }

  async run(): Promise<void> {
    void this.configService.get("OUTPUT_DIRECTORY");
  }
}
