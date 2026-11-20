
_SHELL="$(ps -p $$ -o comm=)"; # bash || sh || zsh
_SHELL="$(basename ${_SHELL//-/})"
case ${_SHELL} in
  zsh)
    _DIR="$( cd "$( dirname "${(%):-%x}" )" && pwd -P )"
    _0="$( basename "${(%):-%N}" )"
    _SCRIPT="${(%):-%N}"
    _BINARY="/bin/zsh"
    ;;
  sh)
    # be carefull this will not work when sourcing this file in sh shell
    # will though work when called /bin/sh my_script.sh from any shell
    _DIR="$( cd "$( dirname "${0}" )" && pwd -P )"
    _0="$( basename "${0}" )"
    _SCRIPT="${0}"
    _BINARY="/bin/sh"
    ;;
  *)
    _DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd -P )"
    _0="$( basename "${BASH_SOURCE[0]}" )"
    _SCRIPT="${BASH_SOURCE[0]}"
    _BINARY="/bin/bash"
    ;;
esac
_PWD="$(pwd)"

_ROOT="${_PWD}";

TESTDIR="${1}";
TESTDIR_GIT="${TESTDIR}/git";

# Optional: binary to test instead of gitignore.ts (see gitignore_filter below).
# Tests run in another directory, so relative path is resolved against the directory we were launched from.
if [[ -n "${GITIGNORE_TO_FIND_BIN}" ]]; then
    if [[ "${GITIGNORE_TO_FIND_BIN}" != /* ]]; then
        GITIGNORE_TO_FIND_BIN="${_ROOT}/${GITIGNORE_TO_FIND_BIN}"
    fi

    if [[ ! -x "${GITIGNORE_TO_FIND_BIN}" ]]; then
        echo "${0} error: GITIGNORE_TO_FIND_BIN >${GITIGNORE_TO_FIND_BIN}< doesn't exist or is not executable"

        exit 1
    fi
fi

source "${TESTDIR}/../tools.sh";

mkdir -p "${TESTDIR_GIT}";

function cleanup {
    rm -rf "${TESTDIR_GIT}";
}

trap cleanup EXIT;

TEST_SCRIPT="${TESTDIR}/test.sh";

(
    cd "${TESTDIR_GIT}";

    if [[ "${TESTDIR_GIT}" == tests/* ]]; then
        rm -rf *; 2> /dev/null
        rm -rf .*; 2> /dev/null
    fi

    # git init send to /dev/null (stdout and stderr) but only when no exit 0
    GIT_INIT_STDOUT="$(git init 2>&1)"
    STATUS="${?}"

    if [[ "${STATUS}" != "0" ]]; then
        echo "${GIT_INIT_STDOUT}"

        exit "${STATUS}"
    fi

    set -e

    source "${TEST_SCRIPT}" 

# ############ debug ################ vvv
# pwd

# echo 

#   find . \( \
#     -type d -name .git -prune \
#   \) \
#   -o \
#   -type f \
#   -print 

# echo 

#   git status

# echo
# ############ debug ################ ^^^

function present {
    cat <<EEE

GIT_OUTPUT: >${GREEN}${GIT_OUTPUT}${RESET}<

FIND_OUTPUT: >${BLUE}${FIND_OUTPUT}${RESET}<

EEE

                                        if [[ "${TEST}" == "1" ]]; then
                                            find . -type d -name .git -prune -o -type f -print

                                            printf "\n      Press Enter to continue\n"
                                            read
                                        fi
}

echo

#
# Filters stdin through the implementation under test.
# By default it is gitignore.ts, but when env var GITIGNORE_TO_FIND_BIN is set
# then that binary is used instead (rust version), e.g.:
#
#   GITIGNORE_TO_FIND_BIN="$(pwd)/rust/bin/arm64/gitignore_to_find" /bin/bash tests/test.sh
#   /bin/bash rust/test.sh     # does the above with detected platform
#
function gitignore_filter {
    if [[ -n "${GITIGNORE_TO_FIND_BIN}" ]]; then
        "${GITIGNORE_TO_FIND_BIN}" ".gitignore"
    else
        NODE_OPTIONS= node "${_ROOT}/gitignore.ts" ".gitignore"
    fi
}

FIND_OUTPUT="$(find . \( \
  -type d -name .git -prune \
\) \
-o \
-type f \
-print | sed 's|^\./||' | gitignore_filter | sort)"

GIT_OUTPUT="$(git ls-files --others --exclude-standard | sort)"

if [[ "${FIND_OUTPUT}" == "${GIT_OUTPUT}" ]]; then
    echo "      test ${TEST_SCRIPT} \"OK\""

    present
else
    echo "${TESTDIR} error: outputs do not match"
    git diff --no-index --color=always <(echo "${FIND_OUTPUT}") <(echo "${GIT_OUTPUT}") || true

    present

    exit 1
fi
)
