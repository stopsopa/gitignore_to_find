
# 
# /bin/bash tests/test.sh
# TEST=1 /bin/bash tests/test.sh
# 

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

set -e

source "${_DIR}/tools.sh"

    cat <<EEE

${GREEN}██${RESET} git
${BLUE}██${RESET} find

EEE

# call tests in order

/bin/bash drive_tests.sh "$(pwd)/tests/001"
/bin/bash drive_tests.sh "$(pwd)/tests/002"
/bin/bash drive_tests.sh "$(pwd)/tests/003"
/bin/bash drive_tests.sh "$(pwd)/tests/004"
/bin/bash drive_tests.sh "$(pwd)/tests/005"
/bin/bash drive_tests.sh "$(pwd)/tests/006"
/bin/bash drive_tests.sh "$(pwd)/tests/007"
/bin/bash drive_tests.sh "$(pwd)/tests/008"
/bin/bash drive_tests.sh "$(pwd)/tests/009"
/bin/bash drive_tests.sh "$(pwd)/tests/010"
/bin/bash drive_tests.sh "$(pwd)/tests/011"
/bin/bash drive_tests.sh "$(pwd)/tests/012"
/bin/bash drive_tests.sh "$(pwd)/tests/013"
/bin/bash drive_tests.sh "$(pwd)/tests/014"
/bin/bash drive_tests.sh "$(pwd)/tests/015"
/bin/bash drive_tests.sh "$(pwd)/tests/016"
/bin/bash drive_tests.sh "$(pwd)/tests/017"

# call tests in order

cat <<EEE

  ${GREEN}All tests passed.${RESET}

EEE
