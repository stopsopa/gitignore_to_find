
# /bin/bash drive_tests.sh "$(pwd)/tests/006"
# TEST=1 /bin/bash drive_tests.sh "$(pwd)/tests/006"
#
# Tests comments and escaped hash comments (\#file).
# Lines beginning with '#' are ignored as comments.
# To match a literal '#' at the beginning, it must be escaped with a backslash.
#

source "${TESTDIR}/../common.sh";

create '#temp.txt'
create '#keep.txt'
create normal.txt
create sub/#temp.txt
create sub/normal.txt

cat <<EEE > .gitignore
# This is a comment and does not match anything
\#temp.txt

EEE
