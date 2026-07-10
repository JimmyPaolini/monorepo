import { describe, expect, it } from "vitest";

import {
  COMPONENTS_DIRECTORY_PATH,
  MODULES_DIRECTORY_PATH,
} from "./generator/generator.constants";
import {
  JUPYTER_NOTEBOOK_APPLICATION_NAME_PROMPT,
  JUPYTER_NOTEBOOK_APPLICATION_TEMPLATE_DIRECTORY_PATH,
} from "./jupyter-notebook-application/jupyter-notebook-application.constants";
import {
  NESTJS_COMMAND_APPLICATION_DESTINATION_ROOT_PROMPT,
  NESTJS_COMMAND_APPLICATION_NAME_PROMPT,
  NESTJS_COMMAND_APPLICATION_TEMPLATE_DIRECTORY_PATH,
} from "./nestjs-command-application/nestjs-command-application.constants";
import {
  NESTJS_DATALOADER_MODULE_NAME_PROMPT,
  NESTJS_DATALOADER_MODULE_PROJECT_PROMPT,
  NESTJS_DATALOADER_MODULE_PROJECT_TAG,
  NESTJS_DATALOADER_MODULE_TEMPLATE_DIRECTORY_PATH,
} from "./nestjs-dataloader-module/nestjs-dataloader-module.constants";
import {
  NESTJS_GRAPHQL_APPLICATION_NAME_PROMPT,
  NESTJS_GRAPHQL_APPLICATION_TEMPLATE_DIRECTORY_PATH,
} from "./nestjs-graphql-application/nestjs-graphql-application.constants";
import {
  NESTJS_GRAPHQL_MODULE_NAME_PROMPT,
  NESTJS_GRAPHQL_MODULE_PROJECT_PROMPT,
  NESTJS_GRAPHQL_MODULE_PROJECT_TAG,
  NESTJS_GRAPHQL_MODULE_TEMPLATE_DIRECTORY_PATH,
} from "./nestjs-graphql-module/nestjs-graphql-module.constants";
import {
  NESTJS_SERVICE_FILE_MODULE_PROMPT,
  NESTJS_SERVICE_FILE_NAME_PROMPT,
  NESTJS_SERVICE_FILE_PROJECT_PROMPT,
  NESTJS_SERVICE_FILE_PROJECT_TAG,
  NESTJS_SERVICE_FILE_TEMPLATE_DIRECTORY_PATH,
} from "./nestjs-service-file/nestjs-service-file.constants";
import {
  NESTJS_SERVICE_MODULE_NAME_PROMPT,
  NESTJS_SERVICE_MODULE_PROJECT_PROMPT,
  NESTJS_SERVICE_MODULE_PROJECT_TAG,
  NESTJS_SERVICE_MODULE_TEMPLATE_DIRECTORY_PATH,
} from "./nestjs-service-module/nestjs-service-module.constants";
import {
  REACT_COMPONENT_NAME_PROMPT,
  REACT_COMPONENT_PROJECT_PROMPT,
  REACT_COMPONENT_PROJECT_TAG,
  REACT_COMPONENT_TEMPLATE_DIRECTORY_PATH,
} from "./react-component/react-component.constants";

describe("module constants", () => {
  it("exports stable project tags", () => {
    expect(COMPONENTS_DIRECTORY_PATH).toBe("src/components");
    expect(MODULES_DIRECTORY_PATH).toBe("src/modules");
    expect(NESTJS_DATALOADER_MODULE_PROJECT_TAG).toBe("framework:nestjs");
    expect(NESTJS_GRAPHQL_MODULE_PROJECT_TAG).toBe("framework:nestjs");
    expect(NESTJS_SERVICE_FILE_PROJECT_TAG).toBe("framework:nestjs");
    expect(NESTJS_SERVICE_MODULE_PROJECT_TAG).toBe("framework:nestjs");
    expect(REACT_COMPONENT_PROJECT_TAG).toBe("framework:react");
  });

  it("exports non-empty prompt strings", () => {
    const prompts = [
      JUPYTER_NOTEBOOK_APPLICATION_NAME_PROMPT,
      NESTJS_COMMAND_APPLICATION_DESTINATION_ROOT_PROMPT,
      NESTJS_COMMAND_APPLICATION_NAME_PROMPT,
      NESTJS_DATALOADER_MODULE_NAME_PROMPT,
      NESTJS_DATALOADER_MODULE_PROJECT_PROMPT,
      NESTJS_GRAPHQL_APPLICATION_NAME_PROMPT,
      NESTJS_GRAPHQL_MODULE_NAME_PROMPT,
      NESTJS_GRAPHQL_MODULE_PROJECT_PROMPT,
      NESTJS_SERVICE_FILE_MODULE_PROMPT,
      NESTJS_SERVICE_FILE_NAME_PROMPT,
      NESTJS_SERVICE_FILE_PROJECT_PROMPT,
      NESTJS_SERVICE_MODULE_NAME_PROMPT,
      NESTJS_SERVICE_MODULE_PROJECT_PROMPT,
      REACT_COMPONENT_NAME_PROMPT,
      REACT_COMPONENT_PROJECT_PROMPT,
    ];

    for (const promptMessage of prompts) {
      expect(promptMessage.length).toBeGreaterThan(0);
    }
  });

  it("exports template directory paths under conformance modules", () => {
    const templatePaths = [
      JUPYTER_NOTEBOOK_APPLICATION_TEMPLATE_DIRECTORY_PATH,
      NESTJS_COMMAND_APPLICATION_TEMPLATE_DIRECTORY_PATH,
      NESTJS_DATALOADER_MODULE_TEMPLATE_DIRECTORY_PATH,
      NESTJS_GRAPHQL_APPLICATION_TEMPLATE_DIRECTORY_PATH,
      NESTJS_GRAPHQL_MODULE_TEMPLATE_DIRECTORY_PATH,
      NESTJS_SERVICE_FILE_TEMPLATE_DIRECTORY_PATH,
      NESTJS_SERVICE_MODULE_TEMPLATE_DIRECTORY_PATH,
      REACT_COMPONENT_TEMPLATE_DIRECTORY_PATH,
    ];

    for (const templatePath of templatePaths) {
      expect(templatePath.startsWith("tools/conformance/src/modules/")).toBe(
        true,
      );
    }
  });
});
