import fs from 'fs/promises';

const th = (msg: string) => new Error(`createStrucutres.ts error: ${msg}`);

export default async function createStrucutres(targetDir: string, string: string) {
  const list = string.split("\n").filter(Boolean);

  if (list.length === 0) {
    throw th("empty list");
  }

  // check if it is a directory targetDir and if it is not attempt to create and then check again and fail if stil it is not
  let stats;
  try {
    stats = await fs.stat(targetDir);
  } catch (error) {
    // doesn't exist
  }

  if (stats && stats.isDirectory()) {
    // it is a directory, do nothing
  } else {
    try {
      await fs.mkdir(targetDir, { recursive: true });
    } catch (error) {
      // attempt create might fail if it's a file
    }

    try {
      const stats2 = await fs.stat(targetDir);
      if (!stats2.isDirectory()) {
        throw th(`Path exists but is not a directory: ${targetDir}`);
      }
    } catch (error) {
      throw th(`Failed to create directory: ${targetDir}`);
    }
  }

}

