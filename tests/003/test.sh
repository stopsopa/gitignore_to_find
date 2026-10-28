
# /bin/bash drive_tests.sh "$(pwd)/tests/003"
# TEST=1 /bin/bash drive_tests.sh "$(pwd)/tests/003"
#
# Tests leading slash anchoring (/root.log).
# Pattern containing a slash anchored at the root matches only the root file,
# not files with the same name in subdirectories (e.g. sub/root.log).
#

source "${TESTDIR}/../common.sh";

create root.log
create root.txt
create sub/root.log
create sub/sub.txt
create a/b/root.log
create a/b/c.txt

cat <<EEE > .gitignore
/root.log

EEE
