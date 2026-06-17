import * as fs from "node:fs/promises";

import type { LoggerService } from "../logger/logger.service.js";
import type { LibraryEntry } from "./literature.types.js";
import type { Author, Text } from "@monorepo/lexico-entities";

interface IngestTextEntryArguments {
  authorEntity: Author;
  authorSlug: string;
  currentText: number;
  logFilePath: string;
  parentTexts: Map<string, Text>;
  textEntry: LibraryEntry;
  totalTexts: number;
}

interface IngestTextEntryDependencies {
  ingestText: (args: {
    author: Author;
    parentText: Text | undefined;
    textPath: string;
    textSlugName: string;
    title: string;
  }) => Promise<void>;
  logger: LoggerService;
}

/** Ingest a single text entry and emit consistent progress/error logs. */
export async function ingestTextEntryWithLogging(
  dependencies: IngestTextEntryDependencies,
  argumentsObject: IngestTextEntryArguments,
): Promise<void> {
  const {
    authorEntity,
    authorSlug,
    currentText,
    logFilePath,
    parentTexts,
    textEntry,
    totalTexts,
  } = argumentsObject;

  const parentText = resolveParentText({ authorSlug, parentTexts, textEntry });
  const hierarchy = buildHierarchyPrefix(authorSlug, parentText);

  dependencies.logger.log(
    `  📜 Starting: ${hierarchy}${textEntry.title} (from ${textEntry.provider})`,
  );

  try {
    await dependencies.ingestText({
      author: authorEntity,
      parentText,
      textPath: textEntry.fullPath,
      textSlugName: textEntry.textSlug,
      title: textEntry.title,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.stack || error.message : String(error);
    dependencies.logger.error(
      `❌ Failed to process ${hierarchy}${textEntry.title} (from ${textEntry.provider}): ${String(error)}`,
    );
    await fs.appendFile(
      logFilePath,
      `[${new Date().toISOString()}] ${textEntry.fullPath}: ${errorMessage}\n`,
    );
  }

  const textProgress = ` (${((currentText / totalTexts) * 100).toFixed(2)}%, ${currentText}/${totalTexts})`;
  dependencies.logger.log(
    `  ✅ Completed: ${hierarchy}${textEntry.title} (from ${textEntry.provider})${textProgress}`,
  );
}

function buildHierarchyPrefix(
  authorSlug: string,
  parentText: Text | undefined,
): string {
  if (!parentText) {
    return "";
  }

  return `${parentText.slug.replace(`${authorSlug}/`, "")} / `;
}

function resolveParentText(args: {
  authorSlug: string;
  parentTexts: Map<string, Text>;
  textEntry: LibraryEntry;
}): Text | undefined {
  const { authorSlug, parentTexts, textEntry } = args;
  if (textEntry.pathParts.length === 0) {
    return undefined;
  }

  const currentPath = [authorSlug, ...textEntry.pathParts].join("/");
  return parentTexts.get(currentPath);
}
