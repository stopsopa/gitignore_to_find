import fs from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

/**
 * Modern async file system operations example
 */

export interface PathStatus {
  exists: boolean;
  isFile: boolean;
  isDirectory: boolean;
  isSymbolicLink: boolean;
  isReadable: boolean;
  isWritable: boolean;
  size: number;
}

/**
 * Get detailed status of a path
 */
export async function getPathStatus(targetPath: string): Promise<PathStatus> {
  const status: PathStatus = {
    exists: false,
    isFile: false,
    isDirectory: false,
    isSymbolicLink: false,
    isReadable: false,
    isWritable: false,
    size: 0,
  };

  try {
    // Check if path exists and get stats
    // Use lstat to not follow symlinks for the initial check
    const stats = await fs.lstat(targetPath);
    status.exists = true;
    status.isFile = stats.isFile();
    status.isDirectory = stats.isDirectory();
    status.isSymbolicLink = stats.isSymbolicLink();
    status.size = stats.size;

    // Check readability
    try {
      await fs.access(targetPath, constants.R_OK);
      status.isReadable = true;
    } catch {
      status.isReadable = false;
    }

    // Check writability
    try {
      await fs.access(targetPath, constants.W_OK);
      status.isWritable = true;
    } catch {
      status.isWritable = false;
    }
  } catch (error) {
    // If lstat fails, it usually means it doesn't exist or isn't accessible
    status.exists = false;
  }

  return status;
}

/**
 * Write content to a file with directory creation and error handling
 */
export async function writeFile(
  filePath: string,
  content: string,
): Promise<void> {
  try {
    const dir = path.dirname(filePath);

    // Ensure parent directory exists
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(filePath, content, "utf8");
  } catch (error: any) {
    throw new Error(
      `fs-async.ts error: Failed to write to ${filePath}. ${error.message}`,
    );
  }
}

/**
 * Read content from a file with error handling
 */
export async function readFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error: any) {
    throw new Error(
      `fs-async.ts error: Failed to read ${filePath}. ${error.message}`,
    );
  }
}

/**
 * Delete a path (file or directory)
 */
export async function removePath(targetPath: string): Promise<void> {
  try {
    // fs.rm works for both files and directories.
    // recursive: true - allows deleting directories with content.
    // force: true - ignores ENOENT (file not found) errors, making it idempotent.
    await fs.rm(targetPath, { recursive: true, force: true });
  } catch (error: any) {
    throw new Error(
      `fs-async.ts error: Failed to remove ${targetPath}. ${error.message}`,
    );
  }
}
