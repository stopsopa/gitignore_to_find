use std::process::Command;

/**
 * Decides what `gitignore_to_find --version` prints.
 * Result is exposed to src/main.rs as compile time env var GITIGNORE_TO_FIND_BUILD_VERSION.
 *
 * Order:
 *   1. GITIGNORE_TO_FIND_VERSION env var (e.g. "dev" from compile.sh or tag from CI)
 *   2. exact git tag of the current commit
 *   3. "dev"
 */
fn main() {
    // If GITIGNORE_TO_FIND_VERSION env var is explicitly provided, respect it
    if let Ok(val) = std::env::var("GITIGNORE_TO_FIND_VERSION") {
        let trimmed = val.trim();
        if !trimmed.is_empty() {
            println!("cargo:rustc-env=GITIGNORE_TO_FIND_BUILD_VERSION={trimmed}");
            return;
        }
    }

    // Try reading exact git tag
    let output = Command::new("git")
        .args(["describe", "--tags", "--exact-match"])
        .output();

    if let Ok(out) = output {
        if out.status.success() {
            let tag = String::from_utf8_lossy(&out.stdout).trim().to_string();
            if !tag.is_empty() {
                println!("cargo:rustc-env=GITIGNORE_TO_FIND_BUILD_VERSION={tag}");
                return;
            }
        }
    }

    // Local / un-tagged fallback
    println!("cargo:rustc-env=GITIGNORE_TO_FIND_BUILD_VERSION=dev");
}
