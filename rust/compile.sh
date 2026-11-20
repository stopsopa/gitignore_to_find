
#
# Compiles rust version of gitignore_to_find into single release binary
# for the platform this script is launched on (detected by ../bash/detect_arch.sh).
#
# Usage:
#   /bin/bash rust/compile.sh
#       result: rust/bin/arm64/gitignore_to_find or rust/bin/x64/gitignore_to_find
#
# Requirements:
#   cargo (https://rustup.rs)
#
# Can be launched from any directory - script always works relative to its own location.
#

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

source "${DIR}/../bash/detect_arch.sh"

GREEN=$'\033[32m'
RESET=$'\033[0m'

if ! command -v cargo >/dev/null 2>&1; then
  echo "${0} error: cargo not found. Install rust from https://rustup.rs"
  exit 1
fi

if [[ ! -f "${DIR}/Cargo.toml" ]]; then
  echo "${0} error: file not found >${DIR}/Cargo.toml<"
  exit 1
fi

echo "Building for target '${TARGET}' (arch: ${ARCH_DIR})..."

# printed by: gitignore_to_find --version
export GITIGNORE_TO_FIND_VERSION="dev"

if [[ -n "${TARGET}" ]]; then
  cargo build --release --target "${TARGET}" --manifest-path "${DIR}/Cargo.toml"
  BUILD_STATUS=$?
else
  cargo build --release --manifest-path "${DIR}/Cargo.toml"
  BUILD_STATUS=$?
fi

if [[ "${BUILD_STATUS}" -ne 0 ]]; then
  echo "${0} error: cargo build failed with exit code >${BUILD_STATUS}<"
  exit "${BUILD_STATUS}"
fi

mkdir -p "${DIR}/bin/${ARCH_DIR}"

# with --target cargo writes to target/<target>/release, without it to target/release
SRC_BIN="${DIR}/target/${TARGET}/release/gitignore_to_find"
if [[ ! -f "${SRC_BIN}" ]]; then
  SRC_BIN="${DIR}/target/release/gitignore_to_find"
fi

if [[ ! -f "${SRC_BIN}" ]]; then
  echo "${0} error: built binary not found at >${SRC_BIN}<"
  exit 1
fi

cp "${SRC_BIN}" "${GITIGNORE_TO_FIND_BIN}"

echo "${GREEN}Done. Binary written to bin/${ARCH_DIR}/gitignore_to_find${RESET}"
