import fs from "fs/promises";
import path from "path";

const th = (msg: string) => new Error(`diskStructuresCreate.ts error: ${msg}`);

export default async function diskStructuresCreate(
  targetDir: string,
  string: string,
) {
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

  if (!stats || !stats.isDirectory()) {
    try {
      await fs.mkdir(targetDir, { recursive: true });
    } catch (error) {
      // attempt create might fail if it's a file
    }

    let stats2;
    try {
      stats2 = await fs.stat(targetDir);
    } catch (error) {
      throw th(
        `Failed to create directory: ${targetDir}, msg: ${String(error)}`,
      );
    }
    
    if (!stats2.isDirectory()) {
      throw th(`Path exists but is not a directory: ${targetDir}`);
    }
  }

  for (const item of list) {
    const filePath = path.join(targetDir, item);
    const dirPath = path.dirname(filePath);

    // item is always path to file, we have to make sure directory exist for that file and only then create a file
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // ignore or handle error if needed
    }

    try {
      await fs.writeFile(filePath, "");
    } catch (error) {
      throw th(`Failed to create file: ${filePath}, error: ${String(error)}`);
    }
  }
}
