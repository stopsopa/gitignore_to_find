
#
# Parity test: compares compiled gitignore_to_find binary with real git.
# Builds a temporary git repo with fixture .gitignore and a tree of files,
# asks 'git check-ignore' which files are ignored and expects our binary
# to print exactly the remaining ones.
#
# Usage:
#   /bin/bash rust/compile.sh
#   /bin/bash rust/test/parity.sh
#
# Exit code 0 when outputs are identical, 1 otherwise (diff is printed).
#
# Requirements:
#   git, compiled binary (rust/bin/<arch>/gitignore_to_find)
#

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

source "${DIR}/../../bash/detect_arch.sh"

GREEN=$'\033[32m'
RED=$'\033[31m'
RESET=$'\033[0m'

if [[ ! -f "${GITIGNORE_TO_FIND_BIN}" ]]; then
  echo "${0} error: binary not found >${GITIGNORE_TO_FIND_BIN}<, run compile.sh first"
  exit 1
fi

TMP="$(mktemp -d)"

if [[ ! -d "${TMP}" ]]; then
  echo "${0} error: mktemp failed"
  exit 1
fi

function cleanup {
  rm -rf "${TMP}"
}

trap cleanup EXIT

cd "${TMP}"

if [[ "$(pwd -P)" != "$(cd "${TMP}" && pwd -P)" ]]; then
  echo "${0} error: can't cd to >${TMP}<"
  exit 1
fi

git init -q .

cat <<'EEE' > .gitignore
# comment

*.log
!important.log
build/
!build/keep.txt
/rootonly.txt
**/deep/secret.txt
docs/**
a/**/z.txt
tmp[0-9].txt
\#hash.txt
\!bang.txt
node_modules
*.tmp
!keep/*.tmp
foo/*
!foo/bar.txt
EEE

# fixture files - one per line
FILES="
important.log
x.log
sub/x.log
sub/important.log
build/keep.txt
build/out.bin
sub/build/a.txt
rootonly.txt
sub/rootonly.txt
deep/secret.txt
m/n/deep/secret.txt
deep/other.txt
docs/a.md
docs/x/b.md
a/z.txt
a/b/c/z.txt
a/b/y.txt
tmp1.txt
tmpx.txt
#hash.txt
!bang.txt
node_modules/p/index.js
sub/node_modules/q.js
keep/a.tmp
other/a.tmp
foo/bar.txt
foo/baz.txt
foo/sub/x.txt
src/main.rs
"

while IFS= read -r FILE; do
  if [[ -n "${FILE}" ]]; then
    mkdir -p "$(dirname "${FILE}")"
    touch "${FILE}"
  fi
done <<< "${FILES}"

export LC_ALL=C

find . -type f -not -path './.git/*' | sed 's#^\./##' | sort > "${TMP}/.git/all.txt"

# git's answer: list of ignored paths (exit code 1 just means "nothing ignored")
git check-ignore --no-index --stdin < "${TMP}/.git/all.txt" | sort > "${TMP}/.git/ignored.txt"

comm -23 "${TMP}/.git/all.txt" "${TMP}/.git/ignored.txt" > "${TMP}/.git/expected.txt"

"${GITIGNORE_TO_FIND_BIN}" .gitignore < "${TMP}/.git/all.txt" | sort > "${TMP}/.git/actual.txt"

if diff "${TMP}/.git/expected.txt" "${TMP}/.git/actual.txt"; then
  echo "${GREEN}parity OK: $(wc -l < "${TMP}/.git/expected.txt" | tr -d ' ') of $(wc -l < "${TMP}/.git/all.txt" | tr -d ' ') paths not ignored, same as git${RESET}"
  exit 0
fi

echo "${RED}parity FAILED: lines with '<' are expected by git, lines with '>' were printed by gitignore_to_find${RESET}"
exit 1
