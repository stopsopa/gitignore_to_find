
# /bin/bash drive_tests.sh "$(pwd)/tests/002"
# TEST=1 /bin/bash drive_tests.sh "$(pwd)/tests/002"
#
# Tests extension wildcards (*.log) without slashes.
# Matches any .log file in root or any subfolder,
# while ignoring non-matching extensions like .log.txt or .txt.
#

source "${TESTDIR}/../common.sh";

create build.log
create debug.log
create access.log.txt
create logs/app.log
create logs/nested/err.log
create keep/build.txt
create keep/doc.md

cat <<EEE > .gitignore
*.log

EEE
