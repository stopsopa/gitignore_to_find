
# /bin/bash drive_tests.sh "$(pwd)/tests/012"
# TEST=1 /bin/bash drive_tests.sh "$(pwd)/tests/012"
#
# Tests double asterisks at the beginning (**/foo/bar).
# Matches 'foo/bar' directly in the root or in any subdirectory.
#

source "${TESTDIR}/../common.sh";

create foo/bar
create src/foo/bar
create nested/deep/foo/bar
create foo/other
create test/foo/baz
create bar

cat <<EEE > .gitignore
**/foo/bar

EEE
