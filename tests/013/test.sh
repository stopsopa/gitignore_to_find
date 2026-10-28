
# /bin/bash drive_tests.sh "$(pwd)/tests/013"
# TEST=1 /bin/bash drive_tests.sh "$(pwd)/tests/013"
#
# Tests middle slash matching without leading slash (doc/frotz).
# Matches relative to gitignore location (i.e. doc/frotz),
# but does not match in a deeper subdirectory like a/doc/frotz.
#

source "${TESTDIR}/../common.sh";

create doc/frotz
create doc/other
create a/doc/frotz
create b/c/doc/frotz
create frotz

cat <<EEE > .gitignore
doc/frotz

EEE
