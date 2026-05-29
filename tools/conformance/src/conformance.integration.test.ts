import { describe, expect, it } from "vitest";

import { CONFORMANCE_TEMPLATE_INSTANCES } from "./generators/conformance-instances";
import {
  stringifyConformanceErrors,
  validateInstanceDirectory,
  validateInstancesDirectory,
} from "./validators/typescript/files";

describe("generator template conformance", () => {
  for (const conformanceCase of CONFORMANCE_TEMPLATE_INSTANCES) {
    it(`validates "${conformanceCase.template}" generated instances`, () => {
      const results =
        conformanceCase.instanceType === "single"
          ? conformanceCase.instanceDirectoryPaths.map((instanceDirectoryPath) =>
              validateInstanceDirectory({
                instanceDirectoryPath,
                templateDirectoryPath: conformanceCase.templateDirectoryPath,
              }),
            )
          : conformanceCase.instanceDirectoryPaths.flatMap(
              (instancesDirectoryPath) =>
                validateInstancesDirectory({
                  instancesDirectoryPath,
                  templateDirectoryPath: conformanceCase.templateDirectoryPath,
                }),
            );

      expect(results.length).toBeGreaterThan(0);
      const errors = stringifyConformanceErrors(results);
      expect(errors).toBeNull();
    });
  }
});
