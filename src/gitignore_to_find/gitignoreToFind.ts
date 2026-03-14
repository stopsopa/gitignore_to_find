export default async function gitignoreToFind(
  gitignoreString: string,
): Promise<string[]> {
  const list = gitignoreString
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => !s.startsWith("#"));

  return list;
}
