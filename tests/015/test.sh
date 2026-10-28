
# /bin/bash drive_tests.sh "$(pwd)/tests/015"
# TEST=1 /bin/bash drive_tests.sh "$(pwd)/tests/015"
#
# Tests negated files inside wildcard directory patterns (arch/*).
# If the directory itself isn't excluded, but its contents are ignored with 'arch/*',
# files inside can be re-included using '!arch/keep.txt'.
#

source "${TESTDIR}/../common.sh";

create arch/file.txt
create arch/dump.tar
create arch/keep.txt
create arch/sub/nested.txt
create arch/sub/keep.txt
create outside.txt

cat <<EEE > .gitignore
arch/*
!arch/keep.txt

EEE
