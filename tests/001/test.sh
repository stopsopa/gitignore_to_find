
# /bin/bash drive_tests.sh "$(pwd)/tests/001"
# TEST=1 /bin/bash drive_tests.sh "$(pwd)/tests/001"
#
# Tests recursive glob matching (**/*.sh).
# Verifies that files matching the wildcard anywhere in the hierarchy
# are ignored while other extensions (.ts, etc.) are tracked.
#

source "${TESTDIR}/../common.sh";

create abc/def/test.ts
create abc/def/test.sh
cat <<EEE > .gitignore
**/*.sh

EEE
