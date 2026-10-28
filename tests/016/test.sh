
# /bin/bash drive_tests.sh "$(pwd)/tests/016"
# TEST=1 /bin/bash drive_tests.sh "$(pwd)/tests/016"
#
# Tests escaped trailing spaces with backslash.
# Trailing spaces are ignored unless escaped with backslash ('\ ').
#

source "${TESTDIR}/../common.sh";

create 'foo '
create 'foo'
create 'bar '
create 'bar'
create 'sub2/foo '
create 'sub3/foo'

cat <<EEE > .gitignore
foo\ 
bar

EEE
