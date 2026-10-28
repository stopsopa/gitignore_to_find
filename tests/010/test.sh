
# /bin/bash drive_tests.sh "$(pwd)/tests/010"
# TEST=1 /bin/bash drive_tests.sh "$(pwd)/tests/010"
#
# Tests double asterisks sandwiched between slashes (a/**/b).
# Matches zero or more directories between 'a' and 'b'.
#

source "${TESTDIR}/../common.sh";

create a/b
create a/x/b
create a/x/y/b
create a/x/y/z/b
create a/b.txt
create a/x/notb
create other/a/x/b
create c/d/b

cat <<EEE > .gitignore
a/**/b

EEE
