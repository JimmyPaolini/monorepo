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
  /** Absolute instance paths to validate for this template. */
  instanceDirectoryPaths: string[];
  /** Whether each path points to one instance directory or a directory of many instances. */
  instanceType: "multiple" | "single";
  /** Human-readable template identifier. */
  template: string;
  /** Absolute path to the template directory used for validation. */
  templateDirectoryPath: string;
}

const NESTJS_COMMAND_APPLICATION_GENERATOR_TAG =
  "generator:nestjs-command-application";
const NESTJS_APPLICATION_TAG = "framework:nestjs";
const APPLICATIONS_DIRECTORY_PATH = path.join(workspaceRoot, "applications");

function resolveTemplateInstances(): ConformanceTemplateInstance[] {
  const applications = resolveWorkspaceApplications();
  return [
    {
      instanceDirectoryPaths: applications
        .filter((application) =>
          application.tags.includes(NESTJS_COMMAND_APPLICATION_GENERATOR_TAG),
        )
        .map((application) => application.rootPath),
      instanceType: "single",
      template: "nestjs-command-application",
      templateDirectoryPath: COMMAND_APPLICATION_TEMPLATES_DIRECTORY_PATH,
    },
    {
      instanceDirectoryPaths: applications
        .filter((application) =>
          application.tags.includes(NESTJS_APPLICATION_TAG),
        )
        .map((application) => path.join(application.rootPath, "src", "modules"))
        .filter((instancesDirectoryPath) =>
          fs.existsSync(instancesDirectoryPath),
        ),
      instanceType: "multiple",
      template: "nestjs-service-module",
      templateDirectoryPath: SERVICE_MODULE_TEMPLATES_DIRECTORY_PATH,
    },
  ];
}

function resolveWorkspaceApplications(): {
  rootPath: string;
  tags: string[];
}[] {
  return fs
    .readdirSync(APPLICATIONS_DIRECTORY_PATH, {
      withFileTypes: true,
    })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        fs.existsSync(
          path.join(APPLICATIONS_DIRECTORY_PATH, entry.name, "project.json"),
        ),
    )
    .map((entry) => {
      const rootPath = path.join(APPLICATIONS_DIRECTORY_PATH, entry.name);
      const projectConfigurationPath = path.join(rootPath, "project.json");
      let projectConfiguration: {
        tags?: string[];
      };
      try {
        projectConfiguration = JSON.parse(
          fs.readFileSync(projectConfigurationPath, "utf8"),
        ) as {
          tags?: string[];
        };
      } catch (error) {
        throw new Error(
          `Unable to parse project configuration at "${projectConfigurationPath}"`,
          {
            cause: error,
          },
        );
      }

      return {
        rootPath,
        tags: projectConfiguration.tags ?? [],
      };
    });
}

describe("generator template conformance", () => {
  for (const conformanceCase of resolveTemplateInstances()) {
    it(`validates "${conformanceCase.template}" generated instances`, () => {
      const results =
        conformanceCase.instanceType === "single"
          ? conformanceCase.instanceDirectoryPaths.map(
              (instanceDirectoryPath) =>
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
