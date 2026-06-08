#!/usr/bin/env tsx
/**
 * Parses TypeORM migration files using the TypeScript compiler API and
 * extracts the raw SQL statements from `up` and `down` methods into separate
 * .sql files for linting and review.
 *
 * Modes:
 *   --mode=latest  (default) Process only the most recently generated migration
 *   --mode=all               Process all migrations
 *
 * Output:
 *   packages/lexico-entities/src/database/migrations/<name>-up.sql
 *   packages/lexico-entities/src/database/migrations/<name>-down.sql
 *
 * Usage (run from workspace root):
 *   pnpm exec tsx packages/lexico-entities/scripts/extract-migration-sql.ts
 *   pnpm exec tsx packages/lexico-entities/scripts/extract-migration-sql.ts --mode=all
 */

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import ts from "typescript";

const MIGRATIONS_DIR =
  "packages/lexico-entities/src/database/migrations" as const;
const MIGRATION_GLOB = /^\d{13}-\w.*\.ts$/;

type Mode = "all" | "latest";

function extractSqlFromMethod(
  method: ts.MethodDeclaration,
  sourceFile: ts.SourceFile,
): string[] {
  const statements: string[] = [];

  function visit(node: ts.Node): void {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "query"
    ) {
      const firstArg = node.arguments[0];
      if (firstArg === undefined) {
        ts.forEachChild(node, visit);
        return;
      }

      let sql: string | undefined;

      if (ts.isStringLiteral(firstArg)) {
        sql = firstArg.text;
      } else if (ts.isNoSubstitutionTemplateLiteral(firstArg)) {
        sql = firstArg.text;
      } else if (ts.isTemplateLiteral(firstArg)) {
        console.warn(
          `Warning: template literal with expressions found at ${sourceFile.fileName}:${sourceFile.getLineAndCharacterOfPosition(firstArg.getStart()).line + 1} — skipping`,
        );
      }

      if (sql !== undefined) {
        const trimmed = sql.trim();
        const normalized = trimmed.endsWith(";") ? trimmed : `${trimmed};`;
        statements.push(normalized);
      }
    }

    ts.forEachChild(node, visit);
  }

  ts.forEachChild(method, visit);
  return statements;
}

function extractSqlFromMigration(
  source: string,
  filePath: string,
): { down: string[]; up: string[] } {
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
  );

  let upStatements: string[] = [];
  let downStatements: string[] = [];

  function visit(node: ts.Node): void {
    if (ts.isClassDeclaration(node)) {
      for (const member of node.members) {
        if (
          ts.isMethodDeclaration(member) &&
          ts.isIdentifier(member.name) &&
          (member.name.text === "up" || member.name.text === "down")
        ) {
          const sql = extractSqlFromMethod(member, sourceFile);
          if (member.name.text === "up") {
            upStatements = sql;
          } else {
            downStatements = sql;
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  ts.forEachChild(sourceFile, visit);

  return { down: downStatements, up: upStatements };
}

async function findMigrationFiles(mode: Mode): Promise<string[]> {
  const entries = await readdir(MIGRATIONS_DIR);
  const sorted = entries.filter((f) => MIGRATION_GLOB.test(f)).toSorted();

  if (sorted.length === 0) {
    throw new Error(`No migration files found in ${MIGRATIONS_DIR}`);
  }

  if (mode === "latest") {
    const latest = sorted.at(-1);
    if (latest === undefined) {
      throw new Error(`No migration files found in ${MIGRATIONS_DIR}`);
    }
    return [path.join(MIGRATIONS_DIR, latest)];
  }

  return sorted.map((f) => path.join(MIGRATIONS_DIR, f));
}

async function main(): Promise<void> {
  const mode = parseMode();
  const migrationPaths = await findMigrationFiles(mode);

  console.log(
    `Mode: ${mode} — processing ${migrationPaths.length} migration(s)`,
  );

  const generatedFiles: string[] = [];

  for (const file of migrationPaths) {
    const { downPath, upPath } = await processMigrationFile(file);
    generatedFiles.push(upPath, downPath);
  }

  console.log(`\nSuccessfully extracted SQL:`);
  for (const file of generatedFiles) {
    console.log(`  ${file}`);
  }
}

function parseMode(): Mode {
  const flag = process.argv.find((arg) => arg.startsWith("--mode="));
  const value = flag?.split("=")[1];
  if (value === "all") return "all";
  return "latest";
}

async function processMigrationFile(
  file: string,
): Promise<{ downPath: string; upPath: string }> {
  const source = await readFile(file, "utf8");

  const { down, up } = extractSqlFromMigration(source, file);

  if (up.length === 0) {
    console.warn(
      `Warning: no SQL statements found in \`up\` method of ${path.basename(file)}`,
    );
  }

  if (down.length === 0) {
    console.warn(
      `Warning: no SQL statements found in \`down\` method of ${path.basename(file)}`,
    );
  }

  const baseName = path.basename(file, ".ts");
  const upPath = path.join(MIGRATIONS_DIR, `${baseName}-up.sql`);
  const downPath = path.join(MIGRATIONS_DIR, `${baseName}-down.sql`);

  const timeoutConfig =
    "SET lock_timeout = '10s';\nSET statement_timeout = '5m';";

  await writeFile(
    upPath,
    `${timeoutConfig}\n\n${up.join("\n\n")}${up.length > 0 ? "\n" : ""}`,
  );
  await writeFile(
    downPath,
    `${timeoutConfig}\n\n${down.join("\n\n")}${down.length > 0 ? "\n" : ""}`,
  );

  console.log(`Wrote ${up.length} statement(s) to ${baseName}-up.sql`);
  console.log(`Wrote ${down.length} statement(s) to ${baseName}-down.sql`);

  return { downPath, upPath };
}

await main();
