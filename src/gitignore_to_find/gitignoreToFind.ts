import isUnignoreInGivenDir from "./isUnignoreInGivenDir.ts";

// # when no negations - faster
// find . \( -path './.git' -prune \) -o \( -path '*/dir/*' -prune \) -o \( -type f -print \)
//     # the same
//     find . -path './.git' -prune -o -path '*/dir/*' -prune  -o -type f -print

// when at least one negation - slower - decending
// find . -type f \( ! -path './.git/*' ! -path '*/dir/*' -o -path './ttt/dir/kloc.ttt' \)
// -------

// EXPERMIMENTS TO OPTIMISE
// when at least one negation - slower - decending directories
// this way we can prune some of them and keep descending into others which we expect to have exclusion from skipped directories
// find . -path './.git' -prune -o -type f \( ! -path '*/dir/*' -o -path './ttt/dir/kloc.ttt' \) -print

// how to handle
// *
// !.gitignore

// find . -type f \( ! -path '*' -o -path './.gitignore' \) -print

type UnignorePathsOtherType = {
  rule: string;
  prune: boolean;
};

type OptionsType = {
  quoteWithSpaces?: boolean;
  quoteStars?: boolean;
  slashBrackets?: boolean;
  debug?: boolean;
};

export default async function gitignoreToFind(
  gitignoreString: string,
  options?: OptionsType,
): Promise<string[]> {
  const { quoteWithSpaces, quoteStars, slashBrackets, debug } = {
    quoteWithSpaces: true,
    quoteStars: true,
    slashBrackets: true,
    debug: false,
    ...options,
  };

  function log(...args: any[]) {
    if (debug) {
      console.log(...args);
    }
  }

  const lines = gitignoreString
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !s.startsWith("#"));

  const prunePaths = new Set<string>(); // all prunes
  const descendPaths = new Set<string>(); // rest should be here

  const unignorePaths = new Set<string>(); /// all ! subset - ready to use
  const unignorePathsRaw = new Set<string>(); /// all ! subset - but ORIGINAL FORM WITH !

  const unignorePathsOther: UnignorePathsOtherType[] = [];
  let atLeastOneUnignoreIsInOtherDir = false;

  lines.forEach((line) => {
    if (line.startsWith("!")) {
      unignorePaths.add(line.slice(1));
      unignorePathsRaw.add(line);
    } else {
      unignorePathsOther.push({
        rule: line,
        prune: false, // by default we will assume we have to descent into directory
      });
    }
  });

  unignorePaths.forEach((unignorePath) => {
    unignorePathsOther.forEach((unignorePathOther) => {
      if (unignorePathOther.prune === false) {
        if (isUnignoreInGivenDir(unignorePathOther.rule, unignorePath)) {
          atLeastOneUnignoreIsInOtherDir = true; // oh damn - this will mean slower final version of find
          unignorePathOther.prune = true;
          descendPaths.add(unignorePathOther.rule);
        }
      }
    });
  });

  lines.forEach((line) => {
    if (!descendPaths.has(line) && !unignorePathsRaw.has(line)) {
      prunePaths.add(line);
    }
  });

  const prunes = [...prunePaths].reduce<string[][]>((acc, prunePath) => {
    return [...acc, ["-path", prefix(prunePath), "-prune"]];
  }, []);

  log("prunes", prunes);

  const descending = [...descendPaths].reduce<string[][]>(
    (acc, descendPath) => {
      return [...acc, ["!", "-path", prefix(descendPath)]];
    },
    [],
  );
  log("descending", descending);

  const unignore = [...unignorePaths].reduce<string[][]>(
    (acc, unignorePath) => {
      return [...acc, ["-path", prefix(unignorePath)]];
    },
    [],
  );

  log("unignore", unignore);

  log("------------");

  const args: string[] = [];

  prunes.forEach((p, i) => {
    if (i > 0) {
      args.push("-o");
    }
    args.push(...p);
  });

  const brackets: string[] = [];

  descending.forEach((d, i) => {
    brackets.push(...d);
  });

  if (brackets.length > 0 || unignore.length > 0) {
    brackets.push("-o");
  }

  unignore.forEach((p, i) => {
    if (i > 0) {
      brackets.push("-o");
    }
    brackets.push(...p);
  });

  log("args", args);

  log("brackets", brackets);

  args.push("-o", "-type", "f");

  if (brackets.length > 0) {
    args.push("(", ...brackets, ")");
  }

  args.push("-print");

  log("args", args);

  let tmp = args;

  if (quoteWithSpaces) {
    tmp = tmp.map((arg) => {
      if (arg.includes(" ")) {
        return `"${arg}"`;
      }
      return arg;
    });
  }

  if (quoteStars) {
    tmp = tmp.map((arg) => {
      if (arg.startsWith('"') && arg.endsWith('"')) {
        return arg;
      }
      if (arg.includes("*")) {
        return `"${arg}"`;
      }
      return arg;
    });
  }

  if (slashBrackets) {
    tmp = tmp.map((arg) => {
      if (arg === "(" || arg === ")") {
        return `\\${arg}`;
      }
      return arg;
    });
  }

  return tmp;
}

function removeLastSlash(path: string) {
  if (path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

function prefix(path: string) {
  if (path.startsWith("/")) {
    return `.${removeLastSlash(path)}`;
  } else {
    return `*/${removeLastSlash(path)}`;
  }
}
