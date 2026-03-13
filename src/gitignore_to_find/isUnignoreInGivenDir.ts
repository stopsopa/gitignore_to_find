
/**
 * Checks if an unignore rule (starting with !) target could be inside a directory matched by dirRule.
 * This is used to decide if we should NOT use -prune on a directory matched by dirRule.
 * 
 * Example:
 * dirRule = "dir/"
 * unignoreRule = "!/test/dir/else/my.txt"
 * Result: true (because to find my.txt, we must enter into /test/dir/ which matches "dir/")
 */
export default function isUnignoreInGivenDir(dirRule: string, unignoreRule: string): boolean {
  // unignoreRule starts with !
  let u = unignoreRule.startsWith("!") ? unignoreRule.slice(1) : unignoreRule;

  // Normalize unignore path (remove leading slash)
  if (u.startsWith("/")) u = u.slice(1);

  // Normalize ignore rule
  let i = dirRule;
  const iIsDirOnly = i.endsWith("/");
  if (iIsDirOnly) i = i.slice(0, -1);

  /**
   * Anchoring logic matching gitignoreToFind.ts:
   * Only true if the rule starts with /
   */
  let anchored = dirRule.startsWith("/");
  let pattern = i;
  
  if (i.startsWith("**/")) {
    anchored = false;
    pattern = i.slice(3);
  } else if (i.startsWith("/")) {
    anchored = true;
    pattern = i.slice(1);
  }

  /**
   * Converts a gitignore pattern segment to regex.
   * Handles * and ?
   */
  const segToRegex = (p: string) => {
    return p
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      .replace(/\*/g, "[^/]*")
      .replace(/\?/g, "[^/]");
  };

  /**
   * Converts the whole pattern to a regex.
   * Handles glob-star in the middle.
   */
  const patternToRegex = (p: string, isAnchored: boolean) => {
    let regexStr = p
      .split("/")
      .map(part => {
        if (part === "**") return "(.+)"; // Matches one or more segments (simplified)
        return segToRegex(part);
      })
      .join("/");
    
    // Replace (.+)/ with (?:.*/|), but actually ** in gitignore can match zero or more dirs.
    // So test/**/mystuff matches test/mystuff
    regexStr = regexStr.replace(/\/\(\.\+\)\//g, "/(?:.*/|)");

    if (isAnchored) {
      return new RegExp("^" + regexStr + "(?:/|$)");
    } else {
      return new RegExp("(?:^|/)" + regexStr + "(?:/|$)");
    }
  };

  const re = patternToRegex(pattern, anchored);

  // If unignoreRule contains **, we can't be sure, so return true conservatively.
  // Unless we want to try matching regex against regex (too complex).
  if (u.includes("**")) {
    return true;
  }

  // Check all directory prefixes of the unignore path.
  // For !/a/b/c.txt, prefixes are "a", "a/b"
  const uSegments = u.split("/");
  let currentPath = "";
  for (let j = 0; j < uSegments.length - 1; j++) {
    currentPath += (currentPath ? "/" : "") + uSegments[j];
    if (re.test(currentPath)) {
      return true;
    }
  }

  // Also check if the unignore final path itself matches (if it could be a directory)
  if (re.test(u)) {
    return true;
  }

  return false;
}