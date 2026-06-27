import { describe, expect, it } from "vitest";

import {
  SYNC_AGENT_SKILLS_FILES,
  SYNC_CONFORMANCE_GENERATORS_FILES,
  SYNC_CONVENTIONAL_CONFIG_FILES,
  SYNC_PULL_REQUEST_TEMPLATE_FILES,
} from "./files";

describe("synchronization file exports", () => {
  it("exports non-empty sync file lists", () => {
    expect(SYNC_AGENT_SKILLS_FILES.length).toBeGreaterThan(0);
    expect(SYNC_CONFORMANCE_GENERATORS_FILES.length).toBeGreaterThan(0);
    expect(SYNC_CONVENTIONAL_CONFIG_FILES.length).toBeGreaterThan(0);
    expect(SYNC_PULL_REQUEST_TEMPLATE_FILES.length).toBeGreaterThan(0);
  });
});
