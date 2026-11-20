
#
# Runs all tests against compiled rust binary:
#   1. shared test suite from tests/ (the same one gitignore.ts is tested with),
#      binary is injected through GITIGNORE_TO_FIND_BIN env var
#   2. rust/test/parity.sh (comparison with 'git check-ignore')
#
# Usage:
#   /bin/bash rust/compile.sh
#   /bin/bash rust/test.sh
#   TEST=1 /bin/bash rust/test.sh     # pause after each test from tests/ (see drive_tests.sh)
#
# Can be launched from any directory.
#

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

source "${DIR}/../bash/detect_arch.sh"

if [[ ! -x "${GITIGNORE_TO_FIND_BIN}" ]]; then
  echo "${0} error: binary not found >${GITIGNORE_TO_FIND_BIN}<, run compile.sh first"
  exit 1
fi

export GITIGNORE_TO_FIND_BIN

# tests/test.sh expects to be launched from the root of the repository
cd "${DIR}/.." || {
  echo "${0} error: can't cd to >${DIR}/..<"
  exit 1
}

echo "Testing binary: ${GITIGNORE_TO_FIND_BIN}"

/bin/bash tests/test.sh || {
  echo "${0} error: tests/test.sh failed"
  exit 1
}

/bin/bash rust/test/parity.sh || {
  echo "${0} error: rust/test/parity.sh failed"
  exit 1
}
