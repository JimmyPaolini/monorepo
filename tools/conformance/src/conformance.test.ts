import fs from "node:fs";
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

interface ConformanceTemplateInstance {
  template: string;
  templateDirectoryPath: string;
  instanceType: "single" | "multiple";
  instanceDirectoryPaths: string[];
}

const GENERATED_NESTJS_APPLICATION_TAG = "generator:nestjs-command-application";
const NESTJS_APPLICATION_TAG = "framework:nestjs";
const APPLICATIONS_DIRECTORY_PATH = path.join(workspaceRoot, "applications");

function resolveWorkspaceApplications(): {
  rootPath: string;
  tags: string[];
}[] {
  return fs
    .readdirSync(APPLICATIONS_DIRECTORY_PATH, {
      withFileTypes: true,
    })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const rootPath = path.join(APPLICATIONS_DIRECTORY_PATH, entry.name);
      const projectConfigurationPath = path.join(rootPath, "project.json");
      if (!fs.existsSync(projectConfigurationPath)) {
        return null;
      }
      const projectConfiguration = JSON.parse(
        fs.readFileSync(projectConfigurationPath, "utf8"),
      ) as {
        tags?: string[];
      };

      return {
        rootPath,
        tags: projectConfiguration.tags ?? [],
      };
    })
    .filter((application): application is { rootPath: string; tags: string[] } =>
      application !== null,
    );
}

function resolveTemplateInstances(): ConformanceTemplateInstance[] {
  const applications = resolveWorkspaceApplications();
  return [
    {
      template: "nestjs-command-application",
      templateDirectoryPath: COMMAND_APPLICATION_TEMPLATES_DIRECTORY_PATH,
      instanceType: "single",
      instanceDirectoryPaths: applications
        .filter((application) =>
          application.tags.includes(GENERATED_NESTJS_APPLICATION_TAG),
        )
        .map((application) => application.rootPath),
    },
    {
      template: "nestjs-service-module",
      templateDirectoryPath: SERVICE_MODULE_TEMPLATES_DIRECTORY_PATH,
      instanceType: "multiple",
      instanceDirectoryPaths: applications
        .filter((application) => application.tags.includes(NESTJS_APPLICATION_TAG))
        .map((application) => path.join(application.rootPath, "src", "modules"))
        .filter((instancesDirectoryPath) => fs.existsSync(instancesDirectoryPath)),
    },
  ];
}

describe("generator template conformance", () => {
  for (const conformanceCase of resolveTemplateInstances()) {
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
