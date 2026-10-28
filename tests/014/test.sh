
# /bin/bash drive_tests.sh "$(pwd)/tests/014"
# TEST=1 /bin/bash drive_tests.sh "$(pwd)/tests/014"
#
# Tests negated directory exception rule.
# According to Git documentation: It is not possible to re-include a file
# if a parent directory of that file is excluded.
# Since 'build/' is excluded, '!build/keep.txt' cannot re-include the file.
#

source "${TESTDIR}/../common.sh";

create build/app.js
create build/keep.txt
create build/sub/file.txt
create src/index.ts
create keep.txt

cat <<EEE > .gitignore
build/
!build/keep.txt

EEE
