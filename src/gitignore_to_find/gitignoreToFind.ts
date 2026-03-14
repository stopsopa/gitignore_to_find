export default async function gitignoreToFind(
  gitignoreString: string,
): Promise<string[]> {
  const list = gitignoreString
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !s.startsWith("#"));

  const result: string[] = [];

  for (const item of list) {
    // if (item.startsWith("!")) {
    //   result.push("-path", item);
    // } else {
      result.push("-not", "-path", item);
    // }
  }

  return result;
}
