
# /bin/bash drive_tests.sh "$(pwd)/tests/004"
# TEST=1 /bin/bash drive_tests.sh "$(pwd)/tests/004"
#
# Tests trailing slash directory matching (build/).
# If a pattern ends with a slash, it matches directories and everything inside them,
# anywhere in the tree.
#

source "${TESTDIR}/../common.sh";

create build.txt
create build/file.txt
create build/sub/nested.txt
create src/build/lib.js
create src/build/other.ts
create src/file.txt

cat <<EEE > .gitignore
build/

EEE
