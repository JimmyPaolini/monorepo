import { Injectable, Scope } from "@nestjs/common";
import DataLoader from "dataloader";

import { SampleEntity } from "./sample.entities";
import { SampleService } from "./sample.service";

/**
 * Sample DataLoader — replace with your domain batch loading logic.
 *
 * Dataloaders are request-scoped to ensure caching is limited to
 * a single GraphQL request, preventing data leakage across requests.
 */
@Injectable({ scope: Scope.REQUEST })
export class SampleDataLoader {
  // 🏗 Dependency Injection

  constructor(private readonly sampleService: SampleService) {}

  // 🔑 Public Fields

  public readonly byId = new DataLoader<string, SampleEntity | null>(
    async (ids: readonly string[]) => {
      // TODO: Implement batch loading via sampleService.
      // Must return an array of the same length and order as `ids`.
      return ids.map(() => null);
    },
  );
}
