
in this directory `tests` in each numbered directory we have single test.sh like tests/001/test.sh

and it's role is to create bunch of files and .gitignore in freshly created directory with `git init`.

Then we use git to list all files git sees after applying gitignore and then we are doing also `find` against that directory
filtering output thorugh gitignore.ts using it's logic which should really achieve the same result as the gitignore and git ls-files.
and then we compare the two, if the same then test passed. If not then present what is different and mark the test as failed (exit 1).

And that is what we need to do in `tests` directory.
Creating new directories like `001`, `002`, `003` etc.
and in them single test.sh and prepare different set of files with different .gitignore file for testing different cases we would like to cover.

Always put comments on top of each test.sh explaining what given test should test. Multiline comments are allowed, for example:
```bash
#
# Tests recursive glob matching (**/*.sh).
# Verifies that files matching the wildcard anywhere in the hierarchy
# are ignored while other extensions (.ts, etc.) are tracked.
#
```

at the end we have to call that script via wrapper tooling script which is pointed to it's directory like

```
/bin/bash drive_tests.sh "$(pwd)/tests/001"
```

put each new test call between two lines

```
# call tests in order
```

keep calling them in the numerical order as directories goes sorted
