#
# Detects OS and cpu architecture of the current machine.
# Not to be executed - source it:
#
#   source "${DIR}/../bash/detect_arch.sh"      # from rust/compile.sh
#   source "${DIR}/../../bash/detect_arch.sh"   # from rust/test/parity.sh
#
# After sourcing these variables are available:
#   ARCH_DIR                - arm64 | x64 | raw 'uname -m' value for unknown platforms
#   TARGET                  - rust target triple, e.g. aarch64-apple-darwin (empty for unknown platforms)
#   GITIGNORE_TO_FIND_BIN   - absolute path where compiled binary should be placed
#                             (<project root>/rust/bin/<ARCH_DIR>/gitignore_to_find)
#

_DETECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
_ROOT_DIR="$(cd "${_DETECT_DIR}/.." && pwd)"

OS="$(uname -s)"
ARCH="$(uname -m)"

case "${OS}" in
  Darwin)
    case "${ARCH}" in
      arm64|aarch64)
        ARCH_DIR="arm64"
        TARGET="aarch64-apple-darwin"
        ;;
      x86_64|amd64)
        ARCH_DIR="x64"
        TARGET="x86_64-apple-darwin"
        ;;
      *)
        ARCH_DIR="${ARCH}"
        TARGET=""
        ;;
    esac
    ;;
  Linux)
    case "${ARCH}" in
      arm64|aarch64)
        ARCH_DIR="arm64"
        TARGET="aarch64-unknown-linux-gnu"
        ;;
      x86_64|amd64)
        ARCH_DIR="x64"
        TARGET="x86_64-unknown-linux-gnu"
        ;;
      *)
        ARCH_DIR="${ARCH}"
        TARGET=""
        ;;
    esac
    ;;
  *)
    ARCH_DIR="${ARCH}"
    TARGET=""
    ;;
esac

GITIGNORE_TO_FIND_BIN="${_ROOT_DIR}/rust/bin/${ARCH_DIR}/gitignore_to_find"
