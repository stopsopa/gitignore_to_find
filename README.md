
![Tests](https://github.com/stopsopa/gitignore_to_find/actions/workflows/test.yml/badge.svg)
<!-- from: https://docs.github.com/en/actions/how-tos/monitor-workflows/add-a-status-badge#using-the-workflow-file-name -->

[![License - GPL-2.0-only](https://img.shields.io/badge/License-GPL--2.0--only-2ea44f?logo=GPL-2.0-only&logoColor=GPL-2.0-only)](https://stopsopa.github.io/gitignore_to_find/LICENSE.txt)

# What is this

This is basically an experiment project attempting to transform rules from any .gitignore like file to set of arguments for `find` shell program to achieve the same result.

Final result is not ideal but seems to generally do it's job for most in most simple cases.

Try to play with it on the [demo page](https://stopsopa.github.io/gitignore_to_find/)

# Second solution in this repository

Since I've discovered that finding set of arguments for `find` to reflect .gitignore excluding arlghoritm cannot be mapped 1:1 I've tried another approach.

See section #issues


So the second approach is just relaying on using separate script which can be used to futher process native output from find using pipe streams:

```

wget https://stopsopa.github.io/gitignore_to_find/gitignore.js 

find . -path 'node_modules' -prune -o -path '.git' -prune -o -type f -print | NODE_OPTIONS="" node gitignore.js .customgitignore

```

So in above example we are doing major exclusion to not enter 'node_modules' and '.git' directories on the `find` level and we are filtering the rest with our script using shell stream.

This approach represent sweat spot between performance and accuracy.

Typescript sourcecode for this script is here [gitignore.ts](gitignore.ts)

It simply relays on [gitignore-parser](https://www.npmjs.com/package/gitignore-parser) library.

# Issues

Here are some of the issues I've encountered during implementation:

### Problem 1

problem of encoding a sequential rule engine into a single boolean expression, which doesn’t map cleanly.

### Problem 2

Git’s negation is not just “not matching”—it’s: “Re-include this path only if its parent directories weren’t excluded”

```
foo/
!foo/bar.txt
```
This does NOT include foo/bar.txt, because foo/ itself is excluded.
👉 To model this correctly, you need:

Directory-level awareness

Knowledge of why something was excluded

find doesn’t track that context.

### Problem 3
Directory pruning vs matching

Git treats directories specially:

If a directory is ignored → Git doesn’t even descend into it

Unless there’s a later negation that forces it to

With find, you’d typically use:

```
-path ./foo -prune
```

But:

Once pruned → you cannot recover children later

Git sometimes needs to descend anyway to evaluate negations

👉 This creates a paradox:

Prune early → lose correctness

Don’t prune → lose performance

### Problem 4

Pattern semantics don’t match globbing

Gitignore patterns ≠ shell globs ≠ find -path

Some differences:

#### ** (recursive wildcard)

```
foo/**/bar
```

Matches any depth

find doesn’t natively support ** semantics cleanly—you fake it with -path, but it’s brittle.

#### Root vs relative matching
```
/foo
```

Only matches at repo root

In find, everything is relative to the starting directory, and you must manually anchor paths.

#### Trailing slash = directories only
```
foo/
```

Matches directories only

In find, you need:

```
-type d -path ...
```

### Problem 5

Per-directory .gitignore files

Git doesn’t use just one .gitignore.

It evaluates:

- .gitignore in every directory
- .git/info/exclude
- global ignore file

And rules are applied relative to where they’re defined

👉 That means:

- The same pattern behaves differently depending on directory depth
- You need a context-aware matcher per directory

find has no concept of “current rule scope”

### Problem 6

Implicit directory inclusion rules

Git has this subtle behavior:

If a parent directory is ignored:

Its children are ignored implicitly

Unless explicitly re-included AND reachable

This leads to cases like:

```
a/
!a/b/
!a/b/c.txt
```

You must:

Not prune a/ entirely

But still treat it as ignored unless exceptions apply

👉 This is very hard to encode in a flat find expression.

### and there is more... 

... but no point trying to describe.
