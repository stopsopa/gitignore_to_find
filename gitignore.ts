/*!
 * @homepage https://github.com/stopsopa/gitignore_to_find
 */

import fs from "fs";
import path from "path";
import readline from "readline";
import ignore from "ignore";

// Handle EPIPE error (e.g. when piping to head)
process.stdout.on("error", (err: any) => {
  if (err.code === "EPIPE") process.exit(0);
});

const printHelp = () => {
  console.log(`
Usage:
  find . -type f | /bin/bash ts.sh gitignore.ts [path_to_gitignore] [options]

Description:
  Reads lines from stdin (e.g. file paths from 'find') line by line and filters them
  based on gitignore rules using 'node-ignore' (matching Git behavior).
  Prints only unignored lines to stdout.

  If no [path_to_gitignore] argument is provided, the tool operates in passthrough mode.
  In passthrough mode, if --filter-module or --filter-string is specified, it extracts
  and transforms/outputs each line using that filter; otherwise it streams raw lines.

Arguments:
  [path_to_gitignore]                   Optional path to a .gitignore pattern file.
                                        If omitted, runs without ignore rules (passthrough or
                                        pure extraction when using --filter-* flags).

Options:
  -h, --help                            Show this help message
  --filter-module <path_to_module>      Path to a JS/TS module with a default export function
                                        used to extract the file path from each stdin line.
                                        Mutually exclusive with --filter-string.
  --filter-string <js_code>             JavaScript function or expression used to extract the
                                        file path from each stdin line.
                                        Mutually exclusive with --filter-module.
  --pass-source-line                    When using a filter (--filter-module / --filter-string),
                                        outputs the original input line instead of the extracted
                                        path. (When gitignore is present, gitignore checks the
                                        extracted path, but prints the source line if not ignored).

Examples:
  # Passthrough mode (no .gitignore supplied):
  find src -type f | /bin/bash ts.sh gitignore.ts

  # Path extraction mode without gitignore filtering (transforming/extracting only):
  cmd | /bin/bash ts.sh gitignore.ts --filter-module ./strip.ts
  cmd | /bin/bash ts.sh gitignore.ts --filter-string 'line => line.replace(/^(delete|create|update)\\s+/, "")'

  # Standard filtering:
  find . -type f | /bin/bash ts.sh gitignore.ts .gitignore
  find . -type f | /bin/bash ts.sh gitignore.ts .gitignore | head -n 10
  find . -type f | /bin/bash ts.sh gitignore.ts /path/to/.dockerignore

  # Extract path before gitignore filtering:
  cmd | /bin/bash ts.sh gitignore.ts .gitignore --filter-module ./strip.ts
  cmd | /bin/bash ts.sh gitignore.ts .gitignore --filter-string 'line => line.replace(/^(delete|create|update)\\s+/, "")'

  # Extract path for gitignore check, but preserve and output original source lines:
  cmd | /bin/bash ts.sh gitignore.ts .gitignore --filter-module ./strip.ts --pass-source-line
  cmd | /bin/bash ts.sh gitignore.ts .gitignore --filter-string 'line => line.replace(/^(delete|create|update)\\s+/, "")' --pass-source-line
`.trim());
};

const rawArgs = process.argv.slice(2);

if (rawArgs.includes("--help") || rawArgs.includes("-h")) {
  printHelp();
  process.exit(0);
}

if (process.stdin.isTTY) {
  printHelp();
  process.exit(1);
}

let gitignorePath: string | undefined;
let filterModulePath: string | undefined;
let filterStringCode: string | undefined;
let passSourceLine = false;

for (let i = 0; i < rawArgs.length; i++) {
  const arg = rawArgs[i];
  if (arg === "--filter-module") {
    if (i + 1 >= rawArgs.length) {
      console.error("gitignore.ts error: --filter-module requires a path argument.");
      process.exit(1);
    }
    filterModulePath = rawArgs[++i];
  } else if (arg === "--filter-string") {
    if (i + 1 >= rawArgs.length) {
      console.error("gitignore.ts error: --filter-string requires a code string argument.");
      process.exit(1);
    }
    filterStringCode = rawArgs[++i];
  } else if (arg === "--pass-source-line") {
    passSourceLine = true;
  } else if (!arg.startsWith("-")) {
    if (!gitignorePath) {
      gitignorePath = arg;
    } else {
      console.error(`gitignore.ts error: unexpected argument: ${arg}`);
      process.exit(1);
    }
  } else {
    console.error(`gitignore.ts error: unknown option: ${arg}`);
    printHelp();
    process.exit(1);
  }
}

if (filterModulePath && filterStringCode) {
  console.error(
    "gitignore.ts error: --filter-module and --filter-string are mutually exclusive. Please specify only one."
  );
  process.exit(1);
}

// Passthrough mode if no gitignorePath is specified
const isPassthrough = !gitignorePath;

let ig: ReturnType<typeof ignore> | undefined;

if (!isPassthrough && gitignorePath) {
  if (!fs.existsSync(gitignorePath)) {
    console.error(
      `gitignore.ts error: .gitignore file not found: ${gitignorePath}`,
    );
    process.exit(1);
  }

  // Initialize ignore library
  try {
    const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
    ig = ignore().add(gitignoreContent);
  } catch (e: any) {
    console.error(
      `gitignore.ts error: failed to read or parse gitignore file: ${e.message}`,
    );
    process.exit(1);
  }
}

type ExtractorFn = (line: string) => string;
let extractor: ExtractorFn = (line: string) => line;

async function setupExtractor() {
  if (filterModulePath) {
    const resolvedPath = path.resolve(process.cwd(), filterModulePath);
    if (!fs.existsSync(resolvedPath)) {
      console.error(
        `gitignore.ts error: --filter-module file not found: ${filterModulePath}`,
      );
      process.exit(1);
    }

    let mod: any;
    try {
      mod = await import(resolvedPath);
    } catch (e: any) {
      console.error(
        `gitignore.ts error: failed to import --filter-module (${filterModulePath}): ${e.message}`,
      );
      process.exit(1);
    }

    if (!mod || !("default" in mod)) {
      console.error(
        `gitignore.ts error: module '${filterModulePath}' does not have a default export.`,
      );
      process.exit(1);
    }

    if (typeof mod.default !== "function") {
      console.error(
        `gitignore.ts error: default export of module '${filterModulePath}' is not a function (received type: ${typeof mod.default}).`,
      );
      process.exit(1);
    }

    extractor = mod.default;
  } else if (filterStringCode !== undefined) {
    try {
      let fn: any;
      try {
        const evaluated = new Function(`"use strict"; return (${filterStringCode});`)();
        if (typeof evaluated === "function") {
          fn = evaluated;
        }
      } catch {
        // Fall back to compiling as function body if evaluating as expression fails
      }

      if (!fn) {
        fn = new Function("line", `"use strict"; ${filterStringCode}`);
      }

      if (typeof fn !== "function") {
        throw new Error("evaluated code is not a function");
      }

      extractor = fn;
    } catch (e: any) {
      console.error(
        `gitignore.ts error: failed to compile --filter-string: ${e.message}`,
      );
      process.exit(1);
    }
  }
}

await setupExtractor();

// Process stdin line by line
const rl = readline.createInterface({
  input: process.stdin,
  terminal: false,
});

rl.on("line", (rawLine) => {
  // Strip trailing \r (CRLF support) but preserve trailing spaces
  const line = rawLine.replace(/\r$/, "");

  if (isPassthrough) {
    if ((filterModulePath || filterStringCode !== undefined) && !passSourceLine) {
      const extracted = extractor(line.trim());
      process.stdout.write(extracted + "\n");
    } else {
      process.stdout.write(line + "\n");
    }
    return;
  }

  // Do not trimEnd/trim, otherwise file paths ending with spaces lose their trailing space
  if (!line) return;

  const targetPath = extractor(line);
  if (!targetPath) return;

  // Strip leading ./ if present
  const cleanPath = targetPath.replace(/^\.\//, "");

  // node-ignore: ig.ignores(cleanPath) returns true if the path matches ignore rules
  if (ig && !ig.ignores(cleanPath)) {
    const output = passSourceLine || (!filterModulePath && filterStringCode === undefined)
      ? line
      : targetPath;
    process.stdout.write(output + "\n");
  }
});

rl.on("close", () => {
  process.exit(0);
});
