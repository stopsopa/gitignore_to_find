
# /bin/bash drive_tests.sh "$(pwd)/tests/008"
# TEST=1 /bin/bash drive_tests.sh "$(pwd)/tests/008"
#
# Tests character ranges and bracket sets ([0-9], [a-z]).
# Matches files where character ranges appear in name.
#

source "${TESTDIR}/../common.sh";

create file0.txt
create file5.txt
create file9.txt
create fileA.txt
create filez.txt
create file10.txt
create sub/file3.txt
create sub/fileX.txt

cat <<EEE > .gitignore
file[0-9].txt

EEE
