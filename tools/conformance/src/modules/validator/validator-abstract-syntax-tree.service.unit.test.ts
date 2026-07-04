import { Test } from "@nestjs/testing";
import {
  createSourceFile,
  type Node,
  ScriptKind,
  ScriptTarget,
  type SourceFile,
} from "typescript";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { ValidatorAbstractSyntaxTreeService } from "./validator-abstract-syntax-tree.service";

import type { ValidatorNodesService } from "./validator-nodes.service";
import type { ConformanceError } from "./validator.types";

describe(ValidatorAbstractSyntaxTreeService, () => {
  let service: ValidatorAbstractSyntaxTreeService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [ValidatorAbstractSyntaxTreeService],
    }).compile();

    service = await module.resolve(ValidatorAbstractSyntaxTreeService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("is defined", () => {
    expect(service).toBeDefined();
  });

  it("accepts matching keyed and keyless nested children", () => {
    const templateFile = createSourceFile(
      "template.ts",
      ["class Example {", "  sampleCall();", "  value: string;", "}"].join(
        "\n",
      ),
      ScriptTarget.Latest,
      true,
      ScriptKind.TS,
    );
    const instanceFile = createSourceFile(
      "instance.ts",
      [
        "class Example {",
        "  sampleCall();",
        "  value: string;",
        "  sampleCall();",
        "}",
      ].join("\n"),
      ScriptTarget.Latest,
      true,
      ScriptKind.TS,
    );

    expect(
      service.validateDepthFirstSearch({
        instanceFile,
        instanceNode: instanceFile,
        language: "typescript",
        templateNode: templateFile,
      }),
    ).toStrictEqual([]);
  });

  it("reports missing keyed children with breadcrumb details", () => {
    const templateFile = createSourceFile(
      "template.ts",
      ["class Example {", "  sampleCall();", "}"].join("\n"),
      ScriptTarget.Latest,
      true,
      ScriptKind.TS,
    );
    const instanceFile = createSourceFile(
      "instance.ts",
      ["class Example {", "}"].join("\n"),
      ScriptTarget.Latest,
      true,
      ScriptKind.TS,
    );

    expect(
      service.validateDepthFirstSearch({
        instanceFile,
        instanceNode: instanceFile,
        language: "typescript",
        templateNode: templateFile,
      }),
    ).toHaveLength(1);
  });

  it("omits expected snippet when resolved snippet text is empty", () => {
    const resolveErrorLocationsSpy = vi.spyOn(
      service as object,
      "resolveErrorLocations" as never,
    ) as unknown as {
      mockReturnValue: (value: unknown) => void;
    };
    resolveErrorLocationsSpy.mockReturnValue({
      breadcrumb: "Identifier",
      instanceCharacter: 0,
      instanceLine: 0,
      snippet: "",
      templateCharacter: 0,
      templateLine: 0,
    });

    const buildError = (
      service as unknown as {
        buildError: (args: {
          instanceFile: SourceFile;
          instanceNode: Node;
          language: "typescript";
          templateChild: Node;
        }) => ConformanceError;
      }
    ).buildError.bind(service);

    const sourceFile = createSourceFile(
      "example.ts",
      "const value = 1;",
      ScriptTarget.Latest,
      true,
      ScriptKind.TS,
    );
    const firstStatement = sourceFile.statements[0] as Node;
    const error = buildError({
      instanceFile: sourceFile,
      instanceNode: firstStatement,
      language: "typescript",
      templateChild: firstStatement,
    });

    expect(error).toMatchObject({
      message: "Missing Identifier",
    });
    expect(error).not.toHaveProperty("expected");
  });

  it("reports missing keyless children when no same-kind node exists", () => {
    const templateFile = createSourceFile(
      "template.ts",
      ["if (flag) {", "  execute();", "}"].join("\n"),
      ScriptTarget.Latest,
      true,
      ScriptKind.TS,
    );
    const instanceFile = createSourceFile(
      "instance.ts",
      ["const value = 1;"].join("\n"),
      ScriptTarget.Latest,
      true,
      ScriptKind.TS,
    );

    const errors = service.validateDepthFirstSearch({
      instanceFile,
      instanceNode: instanceFile,
      language: "typescript",
      templateNode: templateFile,
    });

    expect(errors).toHaveLength(1);
    expect(errors[0]?.message).toContain("Missing IfStatement");
  });

  it("chooses the keyless candidate with fewer nested errors", () => {
    const templateFile = createSourceFile(
      "template.ts",
      ["if (flag) {", "  alpha();", "  beta();", "}"].join("\n"),
      ScriptTarget.Latest,
      true,
      ScriptKind.TS,
    );
    const instanceFile = createSourceFile(
      "instance.ts",
      [
        "if (flag) {",
        "  alpha();",
        "}",
        "if (flag) {",
        "  alpha();",
        "  beta();",
        "}",
      ].join("\n"),
      ScriptTarget.Latest,
      true,
      ScriptKind.TS,
    );

    expect(
      service.validateDepthFirstSearch({
        instanceFile,
        instanceNode: instanceFile,
        language: "typescript",
        templateNode: templateFile,
      }),
    ).toStrictEqual([]);
  });

  it("uses numeric SyntaxKind fallback when kind name is unknown", () => {
    const validatorNodesService = (
      service as unknown as { validatorNodesService: ValidatorNodesService }
    ).validatorNodesService;
    vi.spyOn(validatorNodesService, "getKey").mockReturnValue(null);

    const resolveErrorLocations = (
      service as unknown as {
        resolveErrorLocations: (args: {
          instanceFile: SourceFile;
          instanceNode: Node;
          templateChild: Node;
        }) => {
          breadcrumb: string;
        };
      }
    ).resolveErrorLocations.bind(service);

    const sourceFile = createSourceFile(
      "example.ts",
      "const value = 1;",
      ScriptTarget.Latest,
      true,
      ScriptKind.TS,
    );
    const firstStatement = sourceFile.statements[0] as Node;
    const unknownKindNode = Object.assign(Object.create(firstStatement), {
      getSourceFile: () => sourceFile,
      kind: 999_999,
    }) as Node;

    const result = resolveErrorLocations({
      instanceFile: sourceFile,
      instanceNode: firstStatement,
      templateChild: unknownKindNode,
    });

    expect(result.breadcrumb).toBe("SyntaxKind(999999)");
  });

  it("keeps the existing minimum errors when keyless candidates tie", () => {
    const sourceFile = createSourceFile(
      "example.ts",
      ["if (flag) {", "  alpha();", "}", "if (flag) {", "  alpha();", "}"].join(
        "\n",
      ),
      ScriptTarget.Latest,
      true,
      ScriptKind.TS,
    );
    const firstStatement = sourceFile.statements[0] as Node;
    const secondStatement = sourceFile.statements[1] as Node;

    const validateDepthFirstSearch = vi
      .spyOn(service, "validateDepthFirstSearch")
      .mockImplementation((args) => {
        if (args.instanceNode === args.templateNode) {
          return [];
        }

        if (args.instanceNode === firstStatement) {
          return [
            {
              errorType: "code",
              fix: "first",
              message: "first",
            },
          ];
        }

        return [
          {
            errorType: "code",
            fix: "second",
            message: "second",
          },
        ];
      });
    const templateNode = createSourceFile(
      "template.ts",
      ["if (flag) {", "  alpha();", "}"].join("\n"),
      ScriptTarget.Latest,
      true,
      ScriptKind.TS,
    ).statements[0] as Node;

    const validateKeylessChild = (
      service as unknown as {
        validateKeylessChild: (args: {
          instanceChildren: Node[];
          instanceFile: SourceFile;
          instanceNode: Node;
          language: "typescript";
          templateChild: Node;
        }) => ConformanceError[];
      }
    ).validateKeylessChild.bind(service);

    const errors = validateKeylessChild({
      instanceChildren: [firstStatement, secondStatement],
      instanceFile: sourceFile,
      instanceNode: sourceFile,
      language: "typescript",
      templateChild: templateNode,
    });

    expect(validateDepthFirstSearch).toHaveBeenCalledWith();
    expect(errors).toStrictEqual([
      {
        errorType: "code",
        fix: "first",
        message: "first",
      },
    ]);
  });
});
