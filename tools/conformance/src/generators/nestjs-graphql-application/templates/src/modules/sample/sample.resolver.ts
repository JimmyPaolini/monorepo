import { Resolver } from "@nestjs/graphql";

import { SampleDataLoader } from "./sample.dataloader";
import { SampleEntity } from "./sample.entities";
import { SampleService } from "./sample.service";

/**
 * Sample resolver — replace with your domain queries and mutations.
 */
@Resolver(() => SampleEntity)
export class SampleResolver {
  // 🏗 Dependency Injection

  constructor(
    private readonly sampleDataLoader: SampleDataLoader,
    private readonly sampleService: SampleService,
  ) {}

  // 🔎 Queries

  // 🖋️ Mutations

  // 🔗 Relations
}
