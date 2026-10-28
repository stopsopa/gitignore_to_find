
# /bin/bash drive_tests.sh "$(pwd)/tests/017"
# TEST=1 /bin/bash drive_tests.sh "$(pwd)/tests/017"
#
# Tests unescaped trailing spaces.
# Trailing spaces that are not escaped should be trimmed/ignored by gitignore parser,
# so 'temp   ' matches 'temp' (and not 'temp   ').
#

source "${TESTDIR}/../common.sh";

create temp
create 'temp   '
create other.txt
create sub/temp
create 'sub/temp   '

cat <<EEE > .gitignore
temp   

EEE
