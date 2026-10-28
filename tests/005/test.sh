
# /bin/bash drive_tests.sh "$(pwd)/tests/005"
# TEST=1 /bin/bash drive_tests.sh "$(pwd)/tests/005"
#
# Tests negation pattern (!important.log).
# An optional prefix '!' re-includes any file excluded by an earlier pattern.
# Both root and subfolder important.log should remain tracked.
#

source "${TESTDIR}/../common.sh";

create app.log
create error.log
create important.log
create sub/app.log
create sub/important.log
create sub/data.txt
create other.txt

cat <<EEE > .gitignore
*.log
!important.log

EEE
