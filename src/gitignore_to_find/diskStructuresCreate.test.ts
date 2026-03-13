import { test } from "node:test";
import assert from "node:assert";
import fs from "fs/promises";
import path from "path";
import diskStructuresCreate from "./diskStructuresCreate.ts";
import diskStructuresEmptyDir from "./diskStructuresEmptyDir.ts";

const th = (msg: string) => `diskStructuresCreate.ts error: ${msg}`;

test("diskStructuresCreate", async (t) => {
  const testDir = path.resolve(import.meta.dirname, "../../var/test_diskStructuresCreate");

  await t.test("setup", async () => {
    await diskStructuresEmptyDir(testDir, true);
  });

  await t.test("throws on empty list", async () => {
    await assert.rejects(
      () => diskStructuresCreate(testDir, ""),
      { message: th("empty list") }
    );
  });

  await t.test("creates directory if it doesn't exist and handles files", async () => {
    const list = `
file1.txt
dir1/file2.txt
`;
    await diskStructuresCreate(testDir, list);
    
    const stats1 = await fs.stat(path.join(testDir, "file1.txt"));
    assert.strictEqual(stats1.isFile(), true);
    
    const stats2 = await fs.stat(path.join(testDir, "dir1/file2.txt"));
    assert.strictEqual(stats2.isFile(), true);
  });

  await t.test("throws when path exists but is not a directory", async () => {
    const filePath = path.join(testDir, "notadir.txt");
    await fs.writeFile(filePath, "test");
    
    await assert.rejects(
      () => diskStructuresCreate(filePath, "file.txt\n"),
      { message: th(`Path exists but is not a directory: ${filePath}`) }
    );
  });

  await t.test("throws when targetDir cannot be created", async () => {
    const filePath = path.join(testDir, "blocked_dir.txt");
    await fs.writeFile(filePath, "test");
    const blockedDir = path.join(filePath, "subdir");
    
    await assert.rejects(
      () => diskStructuresCreate(blockedDir, "file.txt\n"),
      (err: any) => err.message.includes(`Failed to create directory: ${blockedDir}`)
    );
  });

  await t.test("throws when file cannot be created", async () => {
    await diskStructuresEmptyDir(testDir, true);
    const list = `
blocked_file.txt
blocked_file.txt/subdir/file2.txt
`;
    await assert.rejects(
      () => diskStructuresCreate(testDir, list),
      (err: any) => err.message.includes(`Failed to create file:`) && err.message.includes(`blocked_file.txt/subdir/file2.txt`)
    );
  });

  await t.test("cleanup", async () => {
    await diskStructuresEmptyDir(testDir, true);
  });
});
