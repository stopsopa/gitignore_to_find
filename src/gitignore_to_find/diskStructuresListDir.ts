import fs from "fs/promises";
import path from "path";

const th = (msg: string) => new Error(`diskStructuresListDir.ts error: ${msg}`);

async function walk(dir: string, baseDir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath, baseDir)));
    } else if (entry.isFile()) {
      files.push(path.relative(baseDir, fullPath));
    }
  }

  return files;
}

export default async function diskStructuresListDir(dirPath: string) {
  // if it's not directory then throw

  let stats;
  try {
    stats = await fs.stat(dirPath);
  } catch (error) {
    throw th(`Failed to get stats for ${dirPath}: ${String(error)}`);
  }

  if (!stats.isDirectory()) {
    throw th(`Path is not a directory: ${dirPath}`);
  }

  return walk(dirPath, dirPath);
}
