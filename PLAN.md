# `gitignore.ts` Plan & Design

A fast CLI filter tool designed to take a stream of file paths on `stdin` (such as output from `find .` or custom pipelines) and filter them using Git `.gitignore` rules via the `node-ignore` library.

## Purpose & Requirements

- **Input**:
  - `stdin`: Stream of lines (e.g. file paths or prefixed file paths like `create src/index.ts`).
  - Argument `[path_to_gitignore]` (optional): Path to a `.gitignore` pattern file (e.g. `.gitignore`, `.dockerignore`). If omitted, enters **passthrough mode** where all lines are piped directly to `stdout`.
- **Output**:
  - `stdout`: Stream of original lines that match unignored files according to gitignore rules (or all lines in passthrough mode).
- **Engine**:
  - Powered by [`node-ignore`](https://github.com/kaelzhang/node-ignore) to closely follow Git ignore specifications (negation `!`, directory rules, comments `#`, globs).
- **Extractor Options (Mutually Exclusive)**:
  - `--filter-module <path>`: Path to a JS/TS module with a `default` exported function `(line: string) => string` that extracts the target file path to test against ignore rules.
    - Validates module existence, default export presence, and verifies that the default export is a function, exiting with code 1 otherwise.
  - `--filter-string <code_str>`: An inline JavaScript function or expression used to extract the target file path from each line (e.g., `line => line.replace(/^(delete|create|update)\s+/, '')`).
- **Source Line Preservation**:
  - `--pass-source-line`: When using an extractor (`--filter-module` / `--filter-string`), outputs the original input line instead of the extracted path if the file passes through or is not ignored.
- **CLI Options & Behavior**:
  - `--help` / `-h`: Displays CLI usage, options, and practical piping examples.
  - TTY validation: Requires stdin stream (exits with help message when invoked interactively without piped input).
  - Graceful handling of `EPIPE` when piping to consumers like `head`.

## Usage & Examples

### Basic Usage

```bash
# Filter find results against project .gitignore
find . -type f | /bin/bash ts.sh gitignore.ts .gitignore

# Or using npx tsx / node directly
find . -type f | npx tsx gitignore.ts .gitignore
```

### Passthrough & Pure Extraction Mode (No gitignore file specified)

```bash
# Streams stdin directly to stdout without filtering
find src -type f | /bin/bash ts.sh gitignore.ts

# Pure path extraction/transformation without gitignore filtering
cmd | /bin/bash ts.sh gitignore.ts --filter-module ./strip.ts
cmd | /bin/bash ts.sh gitignore.ts --filter-string 'line => line.replace(/^(delete|create|update)\s+/, "")'
```

### Line Extraction with `--filter-module`

```bash
# Using an external TS module exporting default extractor function
find src -type f | awk '{ print "create " $0 }' | /bin/bash ts.sh gitignore.ts .gitignore --filter-module ./strip.ts
```

### Line Extraction with `--filter-string`

```bash
# Using inline extraction logic (outputs extracted paths)
find src -type f | awk '{ print "update " $0 }' | /bin/bash ts.sh gitignore.ts .gitignore --filter-string 'line => line.replace(/^(delete|create|update)\s+/, "")'
```

### Preserving Original Lines with `--pass-source-line`

```bash
# Evaluates ignore rules against the extracted path, but outputs the original source line:
find src -type f | awk '{ print "create " $0 }' | /bin/bash ts.sh gitignore.ts .gitignore --filter-module ./strip.ts --pass-source-line
find src -type f | awk '{ print "update " $0 }' | /bin/bash ts.sh gitignore.ts .gitignore --filter-string 'line => line.replace(/^(delete|create|update)\s+/, "")' --pass-source-line
```

### Help Option

```bash
/bin/bash ts.sh gitignore.ts --help
```
