import { test } from "node:test";
import assert from "node:assert";
import fs from "fs/promises";
import path from "path";
import diskStructuresListDir from "./diskStructuresListDir.ts";
import diskStructuresEmptyDir from "./diskStructuresEmptyDir.ts";
import diskStructuresCreate from "./diskStructuresCreate.ts";

const th = (msg: string) => `diskStructuresListDir.ts error: ${msg}`;

test("diskStructuresListDir", async (t) => {
  const testDir = path.resolve(import.meta.dirname, "../../var/test_diskStructuresListDir");

  await t.test("setup", async () => {
    await diskStructuresEmptyDir(testDir, true);
    await fs.mkdir(testDir, { recursive: true });
  });

  await t.test("throws when path does not exist", async () => {
    const nonexistentPath = path.join(testDir, "nonexistent");
    await assert.rejects(
      () => diskStructuresListDir(nonexistentPath),
      (err: any) => err.message.includes("Failed to get stats for") && err.message.includes(nonexistentPath)
    );
  });

  await t.test("throws when path is not a directory", async () => {
    const filePath = path.join(testDir, "file.txt");
    await fs.writeFile(filePath, "test");

    await assert.rejects(
      () => diskStructuresListDir(filePath),
      { message: th(`Path is not a directory: ${filePath}`) }
    );
  });

  await t.test("lists files in directory recursively", async () => {
    const dirToParse = path.join(testDir, "dir_to_parse");
    await diskStructuresCreate(dirToParse, "file1.txt\nsubdir/file2.txt");

    const res = await diskStructuresListDir(dirToParse);
    assert.strictEqual(res.length, 2);
    // Path resolution across platforms could vary, but here relative paths should use '/' or path.sep.
    // Given the logic path.relative(baseDir, fullPath) on UNIX it is 'file1.txt' and 'subdir/file2.txt'.
    assert.ok(res.includes("file1.txt"));
    assert.ok(res.includes("subdir/file2.txt".replace("/", path.sep)));
  });

  await t.test("returns empty array for empty directory", async () => {
    const emptyDir = path.join(testDir, "empty_dir");
    await fs.mkdir(emptyDir, { recursive: true });

    const res = await diskStructuresListDir(emptyDir);
    assert.strictEqual(res.length, 0);
  });

  await t.test("ignores non-files and non-directories (e.g. symlinks)", async () => {
    const symlinkDir = path.join(testDir, "symlink_dir");
    await fs.mkdir(symlinkDir, { recursive: true });
    
    const targetFile = path.join(testDir, "target.txt");
    await fs.writeFile(targetFile, "target");
    
    // Create symlink
    const linkPath = path.join(symlinkDir, "link.txt");
    await fs.symlink(targetFile, linkPath);

    const res = await diskStructuresListDir(symlinkDir);
    // Symlinks are neither isDirectory() nor isFile() when returning from readdir withFileTypes (they are isSymbolicLink())
    // So the walk function ignores them.
    assert.strictEqual(res.length, 0);
  });

  await t.test("cleanup", async () => {
    await diskStructuresEmptyDir(testDir, true);
  });
});
