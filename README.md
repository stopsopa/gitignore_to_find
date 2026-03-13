
![Tests](https://github.com/stopsopa/gitignore_to_find/actions/workflows/test.yml/badge.svg)
<!-- from: https://docs.github.com/en/actions/how-tos/monitor-workflows/add-a-status-badge#using-the-workflow-file-name -->

[![License - GPL-2.0-only](https://img.shields.io/badge/License-GPL--2.0--only-2ea44f?logo=GPL-2.0-only&logoColor=GPL-2.0-only)](https://stopsopa.github.io/gitignore_to_find/LICENSE.txt)

# What is this

This is basically an experiment project attempting to transform rules from any .gitignore like file to set of arguments for `find` shell program to achieve the same result.

Final result is not ideal but seems to generally do it's job for most cases.

Try to play with it on the [demo page](https://stopsopa.github.io/gitignore_to_find/)

# Second solution in this repository

Since I've discovered that finding set of arguments for `find` is not ideal I've decided to try another approach.

So the second approach is just relaying on using separate script which can be used using native shell streams like

```

wget https://stopsopa.github.io/gitignore_to_find/gitignore.js 

find . -path 'node_modules' -prune -o -path '.git' -prune -o -type f -print | NODE_OPTIONS="" node gitignore.js .customgitignore

```

Typescript sourcecode for this script is here [gitignore.ts](gitignore.ts)

It simply relays on [gitignore-parser](https://www.npmjs.com/package/gitignore-parser) library.
