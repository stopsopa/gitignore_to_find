
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [[ -f "${DIR}/.env" ]]; then
    # https://unix.stackexchange.com/a/79065
    eval "$(/bin/bash "${DIR}/bash/exportsource.sh" "${DIR}/.env")"
fi

# -----------------------------------------------------------------------------
# Validation
# -----------------------------------------------------------------------------

# check also if PROJECT_NAME exist
if [[ -z "${PROJECT_NAME}" ]]; then
    echo "${0} error: PROJECT_NAME is not set"
    exit 1
fi

re='^[0-9]+$'

# Validate PORT
if [[ -z "${PORT}" ]]; then
    echo "${0} error: PORT is not set"
    exit 1
fi

if ! [[ "${PORT}" =~ ${re} ]]; then
   echo "${0} error: PORT=>${PORT}< is not a number"
   exit 1
fi

# Validate HOST
if [[ -z "${HOST}" ]]; then
    echo "${0} error: HOST is not set"
    exit 1
fi

export NODE_OPTIONS="${NODE_OPTIONS} --experimental-transform-types"
