

set -e

if [ ! -d .git ]; then
    git init . > /dev/null 2>&1
fi

git status --porcelain --untracked-files=all | sed 's/^?? //'