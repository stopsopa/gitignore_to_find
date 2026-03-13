/*!
 * @homepage https://github.com/stopsopa/gitignore_to_find
 */

import fs from "fs";
import readline from "readline";
import gitignoreParser from "gitignore-parser";

const gitignorePath = process.argv[2];

// Handle EPIPE error (e.g. when piping to head)
process.stdout.on("error", (err: any) => {
  if (err.code === "EPIPE") process.exit(0);
});

// 1. Help / Validation
if (!gitignorePath || process.stdin.isTTY) {
  console.error(
    `Usage: find . -type f | /bin/bash ts.sh gitignore.ts <path_to_gitignore>`,
  );
  process.exit(1);
}

if (!fs.existsSync(gitignorePath)) {
  console.error(
    `gitignore.ts error: .gitignore file not found: ${gitignorePath}`,
  );
  process.exit(1);
}

// 2. Initialize ignore library
let ig: any;
try {
  const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
  ig = gitignoreParser.compile(gitignoreContent);
} catch (e: any) {
  console.error(
    `gitignore.ts error: failed to read or parse gitignore file: ${e.message}`,
  );
  process.exit(1);
}

// 3. Process stdin line by line
const rl = readline.createInterface({
  input: process.stdin,
  terminal: false,
});

rl.on("line", (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  // Strip leading ./ if present
  const cleanPath = trimmed.replace(/^\.\//, "");

  // gitignore-parser uses accepts() to check if a file should be kept
  if (ig.accepts(cleanPath)) {
    process.stdout.write(cleanPath + "\n");
  }
});

rl.on("close", () => {
  process.exit(0);
});
