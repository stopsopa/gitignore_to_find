# `gitignore_to_find` (Rust) Plan & Design

Rust port of `../gitignore.ts`: a CLI filter that reads lines from `stdin` (e.g. output of `find .`), tests them against `.gitignore` rules and prints only unignored lines to `stdout`.

Goals:

- one static binary, no node needed
- ignore decisions as close as possible to what git itself does (`git check-ignore`)
- no embedded JS engine: line extraction is done with regex transformers

## Files

Layout mirrors the `securenv` project (`../__links/securenv`):

```
bash/detect_arch.sh       (project root) detects OS/arch -> TARGET, ARCH_DIR, GITIGNORE_TO_FIND_BIN
rust/
  PLAN.md                 this file
  compile.sh              builds release binary
  Cargo.toml
  build.rs                bakes version into the binary (--version)
  src/main.rs             single file, no modules - tool is small
  test/parity.sh          compares binary with real git, see Verification
  bin/<arch>/gitignore_to_find    build output (arm64 | x64)
  target/                 cargo build dir
```

Add `rust/target` to the root `.gitignore` (and `rust/bin` unless binaries are meant to be committed like in securenv).

## Cargo.toml

Same shape as securenv (`[[bin]]`, `opt-level = 3`, `strip = true`):

```toml
[package]
name = "gitignore_to_find"
version = "0.1.0"
edition = "2021"

[[bin]]
name = "gitignore_to_find"
path = "src/main.rs"

[dependencies]
# gitignore engine from gitoxide - reimplementation of git's own exclude logic
gix-ignore = "0.16"  # gix-glob is used through the re-export gix_ignore::glob
bstr = "1"           # byte-string paths used by the gix API

# Regex for --replace transformers
regex = "1"

[profile.release]
opt-level = 3
strip = true
```

Difference from securenv on purpose: no `clap`. Args are parsed by hand (same loop as the TS version) because `--replace` takes two values, values may be empty or start with `-`, and the help text is custom.

## Gitignore engine: why `gix-ignore`

| option                               | verdict                                                                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `gix-ignore` (gitoxide)              | **chosen** - written as a port of git's exclude code, its test suite is checked against `git check-ignore` output    |
| `ignore` (ripgrep)                   | close, but built on `globset` with known small differences from git wildmatch                                       |
| shelling out to `git check-ignore`   | is git itself, but needs git installed and a repo, can't take an arbitrary pattern file like `.dockerignore` simply |

Exact function signatures of `gix-ignore` changed between releases - check docs.rs for the pinned version before writing code. Shape of the API:

```rust
// build once
let mut search = gix_ignore::Search::default();
search.add_patterns_buffer(&file_bytes, gitignore_path, None /* root */, /* parse options, version dependent */);

// per path: Some(match) with match.pattern.is_negative() == false  ->  ignored
search.pattern_matching_relative_path(path.into(), Some(is_dir), gix_glob::pattern::Case::Sensitive)
```

Patterns are passed with no root, so rules are relative to the paths coming from stdin (same as `ignore().add(content)` in TS), not to the location of the gitignore file.

### Parent directory walk (the important part)

`gix-ignore` answers for one path only. Git decides per directory level while walking the tree: once a directory is excluded, nothing inside can be re-included (`!` rules don't help). To get the same result `is_ignored(path)` does:

```
for every parent dir of path, top-down ("a", "a/b", ...):
    m = match(parent, is_dir = true)
    if m is an ignore match -> return true        // excluded dir, stop, same as git
m = match(path, is_dir = path ends with '/')
return m is an ignore match
```

Example that must work like git:

```
# .gitignore
build/
!build/keep.txt
```

`build/keep.txt` -> ignored (parent excluded, negation can't bring it back).

### Rules for input paths

- one leading `./` is stripped before matching.
- trailing `/` means directory, otherwise the path is treated as a file. Filesystem is never touched (input may be paths that don't exist). So with `find .` (no `-type f`) a line `build` is not matched by pattern `build/` - same as TS version.
- absolute paths and paths starting with `../` are outside of what gitignore can describe -> not ignored, line is printed (TS version throws here).
- matching is case sensitive (git default `core.ignorecase=false`).

## Regex transformers (replace JS `--filter-module` / `--filter-string`)

| TS                           | Rust                                       |
| ---------------------------- | ------------------------------------------ |
| `--filter-string <js_code>`  | `--replace <regex> <replacement>`          |
| `--filter-module <path>`     | removed                                    |
| `--pass-source-line`         | `--pass-source-line` (unchanged)           |

- `--replace` can be given many times; transformers run in the order given, each on the result of the previous one.
- each one replaces the first match only (like JS `.replace()` without `g`); line without a match goes through unchanged.
- replacement supports groups: `$1`, `${1}`, `${name}`; `$$` is a literal `$`.
- syntax is the Rust `regex` crate: no lookaround, no backreferences.
- fewer than two values after `--replace` -> error, exit 1.
- invalid regex -> `gitignore_to_find error: failed to compile --replace regex '<regex>': ...`, exit 1.

"extractor is set" below means: at least one `--replace` was given.

## CLI behavior

Order of checks at startup:

1. `-h` / `--help` anywhere in args -> print help, exit 0.
2. `--version` -> print version baked in by `build.rs` (same as securenv), exit 0. Order: `GITIGNORE_TO_FIND_VERSION` env var (`dev` from `compile.sh`, tag from CI) -> exact git tag -> `dev`.
3. stdin is a TTY (`std::io::IsTerminal`) -> print help, exit 1.
4. Parse args:
   - `--replace` -> takes next two args.
   - `--pass-source-line` -> flag.
   - first arg not starting with `-` -> `gitignore_path`.
   - second such arg -> `unexpected argument: <arg>`, exit 1.
   - any other `-...` -> `unknown option: <arg>`, print help, exit 1.
5. No `gitignore_path` -> passthrough mode.
6. `gitignore_path` given but file missing -> `.gitignore file not found: <path>`, exit 1.
7. Read error -> `failed to read or parse gitignore file: ...`, exit 1.

All errors go to `stderr` prefixed with `gitignore_to_find error: `.

## Line processing

Read stdin with `BufReader::read_until(b'\n')` into a reused `Vec<u8>`, convert with `String::from_utf8_lossy`. Write through `BufWriter` on locked stdout.

Per line:

1. strip trailing `\n`, then one trailing `\r` (CRLF). Do NOT trim spaces - paths can end with a space.
2. passthrough mode:
   - extractor set and no `--pass-source-line` -> print `extract(line.trim())`.
   - otherwise -> print `line` as is.
   - empty lines are kept (same as TS).
3. gitignore mode:
   - empty line -> skip.
   - `target = extract(line)`; empty -> skip.
   - `clean = target` with one leading `./` removed.
   - if not ignored: print `line` when `--pass-source-line` or no extractor, otherwise print `target` (not `clean`).

## EPIPE (`| head`)

Never use `println!` for output (it panics on broken pipe). Every `write`/`flush` on stdout returns `io::Result`; on `ErrorKind::BrokenPipe` exit 0 quietly, on any other error print it and exit 1. Flush once at the end.

## Help text

```
Usage:
  find . -type f | gitignore_to_find [path_to_gitignore] [options]

Description:
  Reads lines from stdin (e.g. file paths from 'find') line by line and filters them
  based on gitignore rules (matching Git behavior).
  Prints only unignored lines to stdout.

  If no [path_to_gitignore] argument is provided, the tool operates in passthrough mode.
  In passthrough mode, if --replace is specified, it transforms and outputs each line
  using it; otherwise it streams raw lines.

Arguments:
  [path_to_gitignore]                   Optional path to a .gitignore pattern file.
                                        If omitted, runs without ignore rules (passthrough or
                                        pure transformation when using --replace).

Options:
  -h, --help                            Show this help message
  --version                             Show version
  --replace <regex> <replacement>       Regex transformer used to extract the file path from
                                        each stdin line. Replaces first match of <regex> with
                                        <replacement> ($1, ${name} refer to capture groups).
                                        Can be repeated - transformers run in the order given.
                                        Syntax: https://docs.rs/regex/latest/regex/#syntax
  --pass-source-line                    When using --replace, outputs the original input line
                                        instead of the extracted path. (When gitignore is present,
                                        gitignore checks the extracted path, but prints the source
                                        line if not ignored).

Examples:
  # Passthrough mode (no .gitignore supplied):
  find src -type f | gitignore_to_find

  # Standard filtering:
  find . -type f | gitignore_to_find .gitignore
  find . -type f | gitignore_to_find .gitignore | head -n 10
  find . -type f | gitignore_to_find /path/to/.dockerignore

  # Transformation only, no gitignore filtering ("create src/a.ts" -> "src/a.ts"):
  cmd | gitignore_to_find --replace '^(delete|create|update)\s+' ''

  # Extract path before gitignore filtering (prints extracted paths):
  cmd | gitignore_to_find .gitignore --replace '^(delete|create|update)\s+' ''

  # Extract path for gitignore check, but output original source lines:
  cmd | gitignore_to_find .gitignore --replace '^(delete|create|update)\s+' '' --pass-source-line

  # Capture groups ("M  src/a.ts (modified)" -> "src/a.ts"):
  cmd | gitignore_to_find .gitignore --replace '^\S+\s+(.*?)\s+\(\w+\)$' '$1'

  # git status --porcelain ("?? src/a.ts" -> "src/a.ts"):
  git status --porcelain | gitignore_to_find .dockerignore --replace '^.{3}' ''

  # Chained transformers, run left to right (strip prefix, then strip line:col suffix):
  cmd | gitignore_to_find .gitignore --replace '^\w+\s+' '' --replace ':\d+:\d+$' ''

  # Rewrite absolute paths to relative ones before the check:
  find "$PWD" -type f | gitignore_to_find .gitignore --replace "^$PWD/" ''
```

## Build

```bash
/bin/bash rust/compile.sh
```

Detects platform through `bash/detect_arch.sh` (project root) and writes `rust/bin/<arm64|x64>/gitignore_to_find`.

## Verification

`rust/test/parity.sh` - compares the binary with real git, outputs must be identical:

```bash
# in a temp dir
git init -q
# copy tested .gitignore + create tree of fixture files, then:
find . -type f -not -path './.git/*' | sed 's#^\./##' | sort > all.txt

# git's answer: paths NOT ignored
git check-ignore --no-index --stdin < all.txt | sort > ignored.txt
comm -23 all.txt ignored.txt > expected.txt

# ours
gitignore_to_find .gitignore < all.txt | sort > actual.txt

diff expected.txt actual.txt
```

Fixture `.gitignore` should cover: `!` negation, negation under an excluded dir, `dir/`, leading `/` anchor, `**/x`, `x/**`, `a/**/b`, `*.ext`, `[a-z]` classes, `\#` and `\!` escapes, trailing spaces (escaped and not), comments, blank lines, CRLF line endings.

Manual checks:

- passthrough: `find . -type f | rust/bin/arm64/gitignore_to_find`
- `| head -n 3` exits clean, no panic message
- no stdin (run in terminal) -> help, exit code 1
- missing gitignore file -> error, exit code 1
- `--replace` with and without `--pass-source-line`, chained `--replace`
- CRLF input, path with trailing space, absolute path

## Implementation steps

1. `Cargo.toml` as above (pin real versions).
2. `src/main.rs`: `print_help`, arg parsing, `die(msg)` helper.
3. Gitignore loading + `is_ignored(path)` with parent directory walk.
4. Transformers (`Vec<(Regex, String)>`) + `extract(line)`.
5. stdin loop + EPIPE-safe output.
6. `/bin/bash rust/compile.sh`.
7. `test/parity.sh` + manual checks above.
