import { test } from "node:test";
import assert from "node:assert";
import fs from "fs/promises";
import path from "path";
import diskStructuresEmptyDir from "./diskStructuresEmptyDir.ts";
import diskStructuresCreate from "./diskStructuresCreate.ts";

const th = (msg: string) => `diskStructuresEmptyDir.ts error: ${msg}`;

test("diskStructuresEmptyDir", async (t) => {
  const testDir = path.resolve(import.meta.dirname, "../../var/test_diskStructuresEmptyDir");

  await t.test("setup", async () => {
    await fs.rm(testDir, { recursive: true, force: true }).catch(() => {});
  });

  await t.test("returns early if path doesn't exist", async () => {
    const res = await diskStructuresEmptyDir(path.join(testDir, "nonexistent"));
    assert.strictEqual(res, undefined);
  });

  await t.test("throws if path is not a directory", async () => {
    await fs.mkdir(testDir, { recursive: true });
    const filePath = path.join(testDir, "file.txt");
    await fs.writeFile(filePath, "test");

    await assert.rejects(
      () => diskStructuresEmptyDir(filePath),
      { message: th(`Provided path is not a directory: ${filePath}`) }
    );
  });

  await t.test("removes directory itself and returns true", async () => {
    const dirToRemove = path.join(testDir, "dir_to_remove");
    await fs.mkdir(dirToRemove, { recursive: true });

    const res = await diskStructuresEmptyDir(dirToRemove, true);
    assert.strictEqual(res, true);

    const exists = await fs.stat(dirToRemove).then(() => true).catch(() => false);
    assert.strictEqual(exists, false);
  });

  await t.test("empties directory without removing itself", async () => {
    const dirToEmpty = path.join(testDir, "dir_to_empty");
    await diskStructuresCreate(dirToEmpty, "file1.txt\nsubdir/file2.txt");

    const res = await diskStructuresEmptyDir(dirToEmpty, false);
    assert.strictEqual(res, undefined);

    const exists = await fs.stat(dirToEmpty).then(() => true).catch(() => false);
    assert.strictEqual(exists, true);

    const files = await fs.readdir(dirToEmpty);
    assert.strictEqual(files.length, 0);
  });

  await t.test("throws if removing directory itself fails (mocked)", async (t) => {
    const dirToRemove = path.join(testDir, "dir_fail_remove");
    await fs.mkdir(dirToRemove, { recursive: true });

    t.mock.method(fs, "rm", async () => {
      throw new Error("Mocked rm error");
    });

    await assert.rejects(
      () => diskStructuresEmptyDir(dirToRemove, true),
      { message: th(`Failed to remove directory ${dirToRemove}: Error: Mocked rm error`) }
    );
  });

  await t.test("returns false if directory still exists after removing itself (mocked)", async (t) => {
    const dirToRemove = path.join(testDir, "dir_fake_remove");
    await fs.mkdir(dirToRemove, { recursive: true });

    t.mock.method(fs, "rm", async () => {});

    const res = await diskStructuresEmptyDir(dirToRemove, true);
    assert.strictEqual(res, false);
  });

  await t.test("throws if failing to remove a file inside (mocked)", async (t) => {
    const dirToEmpty = path.join(testDir, "dir_fail_empty");
    await fs.mkdir(dirToEmpty, { recursive: true });
    const filePath = path.join(dirToEmpty, "file.txt");
    await fs.writeFile(filePath, "test");

    t.mock.method(fs, "rm", async () => {
      throw new Error("Mocked rm error");
    });

    await assert.rejects(
      () => diskStructuresEmptyDir(dirToEmpty, false),
      { message: th(`Failed to remove ${filePath}: Error: Mocked rm error`) }
    );
  });

  await t.test("cleanup", async () => {
    await fs.rm(testDir, { recursive: true, force: true }).catch(() => {});
  });
});
