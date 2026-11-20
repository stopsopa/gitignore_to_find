# Developer Guide

Covers the Rust version of the tool (this directory). Design notes are in [PLAN.md](PLAN.md).

All commands below are meant to be run from the root of the repository.

## Quick start after cloning

Everything needed to go from a fresh clone to a working binary (details of each step are in the sections below):

```sh
git clone git@github.com:stopsopa/gitignore_to_find.git
cd gitignore_to_find

# 1. install Rust (skip if 'cargo --version' already works), then open new terminal or: source "$HOME/.cargo/env"
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 2. check toolchain and download dependencies
/bin/bash rust/validateenv.sh

# 3. build - binary lands in rust/bin/arm64/ or rust/bin/x64/
/bin/bash rust/compile.sh

# 4. test against real git
/bin/bash rust/test.sh

# 5. run it (replace arm64 with x64 on Intel/AMD machines)
find . -type f | rust/bin/arm64/gitignore_to_find .gitignore
rust/bin/arm64/gitignore_to_find --help
```

No other setup is needed - no node, no npm, no config files.

## Local Toolchain Setup

### Install Rust

```sh
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Add the macOS arm64 target

```sh
rustup target add aarch64-apple-darwin
```

### Verify toolchain

Run the validation script to confirm everything is in order:

```sh
/bin/bash rust/validateenv.sh
```

Exit 0 means the local toolchain is ready for development.

## Build locally

```sh
/bin/bash rust/compile.sh
```

Binary is written to `rust/bin/<arm64|x64>/gitignore_to_find` (platform detected by `bash/detect_arch.sh` from the root of the repository).

```sh
rust/bin/arm64/gitignore_to_find --help
rust/bin/arm64/gitignore_to_find --version    # prints "dev" for local builds
find . -type f | rust/bin/arm64/gitignore_to_find .gitignore
```

## Running Tests Locally

```sh
/bin/bash rust/test.sh
```

Runs two things against the compiled binary:

1. the shared suite from `tests/` - the same one `gitignore.ts` is tested with (`/bin/bash tests/test.sh`). Binary is injected through env var, which can be also done by hand:

   ```sh
   GITIGNORE_TO_FIND_BIN="rust/bin/arm64/gitignore_to_find" /bin/bash tests/test.sh
   ```

2. `rust/test/parity.sh` - builds a temporary git repo with fixture `.gitignore` and checks that the binary prints exactly the paths which `git check-ignore` does not report as ignored.

---

## Release and Publishing Process

### CI/CD Workflow Overview

GitHub Actions pipeline `.github/workflows/rust.yml` handles automated building, testing, and release creation:
- **Pushing code to any branch** (or opening a PR) triggers the CI test suite (`rust/compile.sh` and `rust/test.sh`) on Linux x64 (`ubuntu-latest`) and builds cross-platform binaries to ensure build stability. It does **not** create any release.
- **Pushing a git tag** triggers the CI test suite, compiles all binaries, and publishes a new **GitHub Release**.

### Target Platforms Built in CI/CD
- **macOS arm64** (`aarch64-apple-darwin` → `gitignore_to_find-darwin-arm64`)
- **Linux x64** (`x86_64-unknown-linux-gnu` → `gitignore_to_find-linux-x64`)
- **Linux arm64** (`aarch64-unknown-linux-gnu` → `gitignore_to_find-linux-arm64`)

### Version

`gitignore_to_find --version` prints the value baked in at compile time by `rust/build.rs`:

1. `GITIGNORE_TO_FIND_VERSION` env var - `dev` from `rust/compile.sh`, tag name in CI
2. exact git tag of the current commit
3. `dev`

So binaries attached to release `v0.0.5` print `v0.0.5`.

---

## Creating a Release

Use the helper script `rust/tag.sh` to bump version and push tag:

```sh
/bin/bash rust/tag.sh patch   # or minor, major
```

Example session:
```text
Fetching git tags...

Previous tag: v0.0.4
Mode:         patch
New tag:      v0.0.5

Press Enter to create and push tag 'v0.0.5', or Ctrl+C to abort...
Enumerating objects: 9, done.
...
To github.com:stopsopa/gitignore_to_find.git
 * [new tag]         v0.0.5 -> v0.0.5
Successfully created and pushed tag >v0.0.5<
```

### What happens next

1. GitHub Actions detects the tag push and runs the pipeline.
2. It compiles binaries for macOS arm64, Linux x64, and Linux arm64.
3. Computes SHA-256 hashes for all binaries and generates dynamic `curl`, `wget`, and verification commands.
4. Creates and publishes the GitHub Release with attached platform binaries and generated checksum verification notes.
