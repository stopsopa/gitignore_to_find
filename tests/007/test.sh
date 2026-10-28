
# /bin/bash drive_tests.sh "$(pwd)/tests/007"
# TEST=1 /bin/bash drive_tests.sh "$(pwd)/tests/007"
#
# Tests escaped exclamation mark (\!important.txt).
# To match a literal '!' at the beginning of a line, it must be escaped
# with a backslash so it is not treated as a negation prefix.
#

source "${TESTDIR}/../common.sh";

create '!important.txt'
create '!other.txt'
create sub/'!important.txt'
create sub/normal.txt

cat <<EEE > .gitignore
\!important.txt

EEE
