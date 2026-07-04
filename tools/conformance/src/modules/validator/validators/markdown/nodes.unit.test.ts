import { describe, expect, it } from "vitest";

import {
  CONTAINER_TYPES,
  getNodeChildren,
  isCode,
  isHeading,
  isHtml,
  isImage,
  isInlineCode,
  isLink,
  isList,
  isTable,
  isText,
  type MdastNode,
} from "./nodes";

describe("markdown nodes", () => {
  it("returns children or an empty array", () => {
    const withChildren: MdastNode = {
      children: [{ type: "text", value: "child" }],
      type: "paragraph",
    };
    const withoutChildren: MdastNode = { type: "paragraph" };

    expect(getNodeChildren(withChildren)).toStrictEqual([
      { type: "text", value: "child" },
    ]);
    expect(getNodeChildren(withoutChildren)).toStrictEqual([]);
  });

  it("defines expected container node types", () => {
    expect(CONTAINER_TYPES.has("blockquote")).toBe(true);
    expect(CONTAINER_TYPES.has("document")).toBe(true);
    expect(CONTAINER_TYPES.has("list")).toBe(true);
    expect(CONTAINER_TYPES.has("listItem")).toBe(true);
    expect(CONTAINER_TYPES.has("root")).toBe(true);
    expect(CONTAINER_TYPES.has("table")).toBe(true);
    expect(CONTAINER_TYPES.has("tableCell")).toBe(true);
    expect(CONTAINER_TYPES.has("tableRow")).toBe(true);
    expect(CONTAINER_TYPES.has("paragraph")).toBe(false);
  });

  it("checks node type guards", () => {
    expect(isCode({ type: "code" })).toBe(true);
    expect(isCode({ type: "text" })).toBe(false);

    expect(isHeading({ type: "heading" })).toBe(true);
    expect(isHeading({ type: "paragraph" })).toBe(false);

    expect(isHtml({ type: "html" })).toBe(true);
    expect(isHtml({ type: "heading" })).toBe(false);

    expect(isImage({ type: "image" })).toBe(true);
    expect(isImage({ type: "link" })).toBe(false);

    expect(isInlineCode({ type: "inlineCode" })).toBe(true);
    expect(isInlineCode({ type: "code" })).toBe(false);

    expect(isLink({ type: "link" })).toBe(true);
    expect(isLink({ type: "image" })).toBe(false);

    expect(isList({ type: "list" })).toBe(true);
    expect(isList({ type: "table" })).toBe(false);

    expect(isTable({ type: "table" })).toBe(true);
    expect(isTable({ type: "list" })).toBe(false);

    expect(isText({ type: "text" })).toBe(true);
    expect(isText({ type: "inlineCode" })).toBe(false);
  });
});
