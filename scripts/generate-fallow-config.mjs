// scripts/generate-fallow-config.mjs
// Serializes configuration/fallow.config.mjs → .fallowrc.jsonc for fallow CLI consumption.
// Fallow's CLI only accepts JSON/JSONC/TOML config; the .mjs file is the authoritative source.
// Run via: node scripts/generate-fallow-config.mjs (or pnpm exec nx run monorepo:fallow-config)
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import config from "../configuration/fallow.config.mjs";

const output = JSON.stringify(config, null, 2);
const destination = resolve(process.cwd(), ".fallowrc.jsonc");
writeFileSync(destination, output, "utf8");
console.log(`fallow-config: wrote ${destination}`);
