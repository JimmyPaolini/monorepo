import path from "node:path";

import { workspaceRoot } from "@nx/devkit";
import { describe, expect, it } from "vitest";

import { TEMPLATES_DIRECTORY_PATH as COMMAND_APPLICATION_TEMPLATES_DIRECTORY_PATH } from "./generators/nestjs-command-application/generator";
import { TEMPLATES_DIRECTORY_PATH as SERVICE_MODULE_TEMPLATES_DIRECTORY_PATH } from "./generators/nestjs-service-module/generator";
import {
  stringifyConformanceErrors,
  validateInstanceDirectory,
  validateInstancesDirectory,
} from "./validators/typescript/files";

const TEMPLATE_INSTANCE_CONFORMANCE_CASES = [
  {
    template: "nestjs-command-application",
    templateDirectoryPath: COMMAND_APPLICATION_TEMPLATES_DIRECTORY_PATH,
    instanceType: "single" as const,
    instanceDirectoryPaths: [path.join(workspaceRoot, "applications", "caelundas")],
  },
  {
    template: "nestjs-service-module",
    templateDirectoryPath: SERVICE_MODULE_TEMPLATES_DIRECTORY_PATH,
    instanceType: "multiple" as const,
    instanceDirectoryPaths: [
      path.join(workspaceRoot, "applications", "caelundas", "src", "modules"),
    ],
  },
];

describe("generator template conformance", () => {
  for (const conformanceCase of TEMPLATE_INSTANCE_CONFORMANCE_CASES) {
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
