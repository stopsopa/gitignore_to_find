import fs from 'fs/promises';
import path from 'path';

const th = (msg: string) => new Error(`diskStructuresEmptyDir.ts error: ${msg}`);

export default async function diskStructuresEmptyDir(dirPath: string, removeItself = false) {
  let stats;
  try {
    stats = await fs.stat(dirPath);
  } catch (error) {
    // doesn't exist, nothing to empty
    return;
  }

  if (!stats.isDirectory()) {
    throw th(`Provided path is not a directory: ${dirPath}`);
  }

  if (removeItself) {
    try {
      await fs.rm(dirPath, { recursive: true, force: true });
    } catch (error) {
      throw th(`Failed to remove directory ${dirPath}: ${String(error)}`);
    }
    
    try {
      await fs.stat(dirPath);
      return false; // Path still exists
    } catch (error) {
      // Path doesn't exist, successful removal
      return true;
    }
  }

  const files = await fs.readdir(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    try {
      await fs.rm(fullPath, { recursive: true, force: true });
    } catch (error) {
      throw th(`Failed to remove ${fullPath}: ${String(error)}`);
    }
  }
}