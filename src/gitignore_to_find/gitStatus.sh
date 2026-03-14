

set -e

git init . > /dev/null 2>&1

git status --porcelain --untracked-files=all | sed 's/^?? //'