GRAY="$(printf '\033[38;5;244m')"
BLACK="$(printf '\033[30m')"
RED="$(printf '\033[31m')"
GREEN="$(printf '\033[32m')"
YELLOW="$(printf '\033[33m')"
BLUE="$(printf '\033[34m')"
MAGENTA="$(printf '\033[35m')"
CYAN="$(printf '\033[36m')"
WHITE="$(printf '\033[37m')"
BOLD="$(printf '\033[1m')"
REVERSE="$(printf '\033[7m')"
RESET="$(printf '\033[0m')"

# safe function allowing creation of file in given (relative) location
function create {

    local path="${1}"

    # Reject absolute paths and paths containing '..'
    if [[ "${path}" == /* || "${path}" == *..* ]]; then
        echo "Invalid path: ${path}" >&2
        return 1
    fi

    if [[ "${path}" == */* ]]; then
        local dir
        dir="$(dirname -- "${path}")"
        mkdir -p -- "${dir}"
    fi

    touch -- "${path}"
}