
# /bin/bash drive_tests.sh "$(pwd)/tests/009"
# TEST=1 /bin/bash drive_tests.sh "$(pwd)/tests/009"
#
# Tests single character wildcard question mark (?);
# Matches any single character except a slash.
#

source "${TESTDIR}/../common.sh";

create file1.txt
create fileA.txt
create file12.txt
create file.txt
create sub/file2.txt
create sub/fileAB.txt

cat <<EEE > .gitignore
file?.txt

EEE
