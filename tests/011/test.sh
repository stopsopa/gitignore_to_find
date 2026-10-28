
# /bin/bash drive_tests.sh "$(pwd)/tests/011"
# TEST=1 /bin/bash drive_tests.sh "$(pwd)/tests/011"
#
# Tests double asterisks at the end (docs/**).
# Matches everything inside directory 'docs' with infinite depth.
#

source "${TESTDIR}/../common.sh";

create docs/readme.md
create docs/api/v1/spec.json
create docs/assets/img.png
create other/docs/file.txt
create src/index.ts
create root.md

cat <<EEE > .gitignore
docs/**

EEE
