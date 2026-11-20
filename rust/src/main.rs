/*!
 * @homepage https://github.com/stopsopa/gitignore_to_find
 *
 * Rust port of gitignore.ts.
 * Reads lines from stdin and prints only those which are not ignored by given gitignore file.
 * See PLAN.md for design notes.
 */

use std::borrow::Cow;
use std::fs;
use std::io::{self, BufRead, BufWriter, ErrorKind, IsTerminal, Write};
use std::path::Path;
use std::process;

use bstr::BStr;
use gix_ignore::glob::pattern::Case;
use gix_ignore::search::Ignore;
use gix_ignore::Search;
use regex::Regex;

// Set by build.rs (GITIGNORE_TO_FIND_VERSION env var -> exact git tag -> "dev")
const VERSION: &str = env!("GITIGNORE_TO_FIND_BUILD_VERSION");

const HELP: &str = r#"Usage:
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
                                        <replacement>. Capture groups: ${1}, ${name}
                                        ($1 works too, but not directly before a letter/digit/_).
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
  cmd | gitignore_to_find .gitignore --replace '^\S+\s+(.*?)\s+\(\w+\)$' '${1}'

  # git status --porcelain ("?? src/a.ts" -> "src/a.ts"):
  git status --porcelain | gitignore_to_find .dockerignore --replace '^.{3}' ''

  # Chained transformers, run left to right (strip prefix, then strip line:col suffix):
  cmd | gitignore_to_find .gitignore --replace '^\w+\s+' '' --replace ':\d+:\d+$' ''

  # Rewrite absolute paths to relative ones before the check:
  find "$PWD" -type f | gitignore_to_find .gitignore --replace "^$PWD/" ''"#;

fn print_help() {
    println!("{HELP}");
}

// Prints error to stderr and exits with code 1
fn die(msg: &str) -> ! {
    eprintln!("gitignore_to_find error: {msg}");
    process::exit(1);
}

/**
 * Handles result of every write to stdout.
 * Broken pipe (e.g. when piping to head) is a normal way to finish - exit 0 quietly.
 */
fn check_write(result: io::Result<()>) {
    if let Err(e) = result {
        if e.kind() == ErrorKind::BrokenPipe {
            process::exit(0);
        }
        die(&format!("failed to write to stdout: {e}"));
    }
}

// Writes one line + newline to stdout
fn write_line(out: &mut impl Write, line: &[u8]) {
    check_write(out.write_all(line).and_then(|_| out.write_all(b"\n")));
}

struct Args {
    gitignore_path: Option<String>,
    // --replace <regex> <replacement> pairs in the order given
    transformers: Vec<(Regex, String)>,
    pass_source_line: bool,
}

/**
 * Parses command line arguments (without program name).
 *
 *   gitignore_to_find
 *   gitignore_to_find .gitignore
 *   gitignore_to_find .gitignore --replace '^create\s+' ''
 *   gitignore_to_find .gitignore --replace '^\w+\s+' '' --replace ':\d+$' '' --pass-source-line
 */
fn parse_args(raw: &[String]) -> Args {
    let mut args = Args {
        gitignore_path: None,
        transformers: Vec::new(),
        pass_source_line: false,
    };

    let mut i = 0;
    while i < raw.len() {
        let arg = raw[i].as_str();

        if arg == "--replace" {
            if i + 2 >= raw.len() {
                die("--replace requires two arguments: <regex> <replacement>.");
            }
            let pattern = &raw[i + 1];
            let replacement = &raw[i + 2];
            i += 2;

            match Regex::new(pattern) {
                Ok(re) => args.transformers.push((re, replacement.clone())),
                Err(e) => die(&format!(
                    "failed to compile --replace regex '{pattern}': {e}"
                )),
            }
        } else if arg == "--pass-source-line" {
            args.pass_source_line = true;
        } else if arg.starts_with('-') {
            eprintln!("gitignore_to_find error: unknown option: {arg}");
            print_help();
            process::exit(1);
        } else if args.gitignore_path.is_some() {
            die(&format!("unexpected argument: {arg}"));
        } else {
            args.gitignore_path = Some(arg.to_string());
        }

        i += 1;
    }

    args
}

/**
 * Loads gitignore file into the gix-ignore matcher.
 * Patterns are registered without root, so they are matched against paths
 * exactly as they come from stdin - not relative to the gitignore file location.
 */
fn load_gitignore(gitignore_path: &str) -> Search {
    if !Path::new(gitignore_path).exists() {
        die(&format!(".gitignore file not found: {gitignore_path}"));
    }

    let bytes = match fs::read(gitignore_path) {
        Ok(bytes) => bytes,
        Err(e) => die(&format!("failed to read or parse gitignore file: {e}")),
    };

    let mut search = Search::default();
    search.add_patterns_buffer(
        &bytes,
        gitignore_path,
        None,
        Ignore {
            support_precious: false,
        },
    );
    search
}

/**
 * Checks single path (no parents) against the rules.
 * Last matching pattern wins: true when it is a normal pattern, false when it is a negated (!) one
 * or when nothing matched.
 */
fn excluded(search: &Search, path: &[u8], is_dir: bool) -> bool {
    match search.pattern_matching_relative_path(BStr::new(path), Some(is_dir), Case::Sensitive) {
        Some(m) => !m.pattern.is_negative(),
        None => false,
    }
}

/**
 * Equivalent of `git check-ignore` for one path.
 *
 * Git decides per directory level while walking the tree: once a directory is excluded
 * nothing inside can be re-included with '!' rules. So parents are checked top-down first
 * ("a", "a/b", ...) and only then the path itself.
 *
 * Trailing '/' means directory, otherwise path is treated as a file (filesystem is never touched).
 * Absolute paths and paths escaping with '../' can't be described by gitignore -> not ignored.
 */
fn is_ignored(search: &Search, path: &[u8]) -> bool {
    if path.is_empty() || path.starts_with(b"/") || path == b".." || path.starts_with(b"../") {
        return false;
    }

    let (path, is_dir) = match path.strip_suffix(b"/") {
        Some(stripped) => (stripped, true),
        None => (path, false),
    };

    for (i, byte) in path.iter().enumerate() {
        if *byte == b'/' && i > 0 && excluded(search, &path[..i], true) {
            return true;
        }
    }

    excluded(search, path, is_dir)
}

// Runs all --replace transformers in order, each one replaces first match only
fn extract(transformers: &[(Regex, String)], line: &str) -> String {
    let mut current = line.to_string();
    for (re, replacement) in transformers {
        if let Cow::Owned(replaced) = re.replace(&current, replacement.as_str()) {
            current = replaced;
        }
    }
    current
}

fn main() {
    let raw: Vec<String> = std::env::args().skip(1).collect();

    if raw.iter().any(|a| a == "--help" || a == "-h") {
        print_help();
        process::exit(0);
    }

    if raw.iter().any(|a| a == "--version") {
        println!("{VERSION}");
        process::exit(0);
    }

    if io::stdin().is_terminal() {
        print_help();
        process::exit(1);
    }

    let args = parse_args(&raw);

    // Passthrough mode if no gitignore path is specified
    let search = args.gitignore_path.as_deref().map(load_gitignore);

    let has_extractor = !args.transformers.is_empty();

    let stdin = io::stdin();
    let mut input = stdin.lock();
    let stdout = io::stdout();
    let mut out = BufWriter::new(stdout.lock());

    // Process stdin line by line (as bytes - file names are not always valid UTF-8)
    let mut buf: Vec<u8> = Vec::with_capacity(4096);
    loop {
        buf.clear();
        match input.read_until(b'\n', &mut buf) {
            Ok(0) => break,
            Ok(_) => {}
            Err(e) => die(&format!("failed to read stdin: {e}")),
        }

        // Strip trailing \n and \r (CRLF support) but preserve trailing spaces
        let mut line: &[u8] = &buf;
        if let Some(stripped) = line.strip_suffix(b"\n") {
            line = stripped;
        }
        if let Some(stripped) = line.strip_suffix(b"\r") {
            line = stripped;
        }

        let search = match &search {
            Some(search) => search,
            None => {
                // Passthrough mode
                if has_extractor && !args.pass_source_line {
                    let text = String::from_utf8_lossy(line);
                    let extracted = extract(&args.transformers, text.trim());
                    write_line(&mut out, extracted.as_bytes());
                } else {
                    write_line(&mut out, line);
                }
                continue;
            }
        };

        // Do not trim, otherwise file paths ending with spaces lose their trailing space
        if line.is_empty() {
            continue;
        }

        let target: Cow<[u8]> = if has_extractor {
            let text = String::from_utf8_lossy(line);
            Cow::Owned(extract(&args.transformers, &text).into_bytes())
        } else {
            Cow::Borrowed(line)
        };

        if target.is_empty() {
            continue;
        }

        // Strip leading ./ if present
        let clean_path: &[u8] = target.strip_prefix(b"./").unwrap_or(&target);

        if is_ignored(search, clean_path) {
            continue;
        }

        if args.pass_source_line || !has_extractor {
            write_line(&mut out, line);
        } else {
            write_line(&mut out, &target);
        }
    }

    check_write(out.flush());
}
