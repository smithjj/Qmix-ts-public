#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const isBun = process.versions.bun !== undefined;
const wantsTui = process.argv.slice(2).includes("--tui");

if (wantsTui && !isBun) {
  const result = spawnSync(
    "bun",
    [resolve(dirname(fileURLToPath(import.meta.url)), "../dist/cli.js"), ...process.argv.slice(2)],
    { stdio: "inherit", shell: false }
  );
  if (result.error) {
    console.error("Error: the TUI requires Bun. Install it from https://bun.sh and make sure 'bun' is in your PATH.");
    console.error("Alternatively, run directly with Bun:");
    console.error("  bun node_modules/qmix-typescript/dist/cli.js --tui");
    process.exit(1);
  }
  process.exit(result.status ?? 0);
}

import("../dist/cli.js");
