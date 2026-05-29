import path from "node:path";

import { workspaceRoot } from "@nx/devkit";

import { TEMPLATES_DIRECTORY_PATH as COMMAND_APPLICATION_TEMPLATES_DIRECTORY_PATH } from "./nestjs-command-application/generator";
import { TEMPLATES_DIRECTORY_PATH as SERVICE_MODULE_TEMPLATES_DIRECTORY_PATH } from "./nestjs-service-module/generator";

/**
 * Declares workspace instances that must conform to a specific generator template.
 */
export interface ConformanceTemplateInstance {
  /** Human-readable generator template identifier. */
  template: string;
  /** Absolute path to the template directory used for validation. */
  templateDirectoryPath: string;
  /** Whether each path points to one instance or a parent directory of many instances. */
  instanceType: "single" | "multiple";
  /** Absolute instance paths to validate for this template. */
  instanceDirectoryPaths: string[];
}

export const CONFORMANCE_TEMPLATE_INSTANCES: ConformanceTemplateInstance[] = [
  {
    template: "nestjs-command-application",
    templateDirectoryPath: COMMAND_APPLICATION_TEMPLATES_DIRECTORY_PATH,
    instanceType: "single",
    instanceDirectoryPaths: [path.join(workspaceRoot, "applications", "caelundas")],
  },
  {
    template: "nestjs-service-module",
    templateDirectoryPath: SERVICE_MODULE_TEMPLATES_DIRECTORY_PATH,
    instanceType: "multiple",
    instanceDirectoryPaths: [
      path.join(workspaceRoot, "applications", "caelundas", "src", "modules"),
    ],
  },
];
