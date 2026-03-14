

set -e

DIR="${1}"

cd "${DIR}"

git init .

git status --porcelain --untracked-files=all | sed 's/^?? /.\//'