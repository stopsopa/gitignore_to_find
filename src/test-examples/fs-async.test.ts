import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { getPathStatus, writeFile, readFile, removePath } from "./fs-async.js";

/**
 * /bin/bash ts.sh --test src/test-examples/fs-async.test.ts
 */
describe("fs-async example tests", () => {
  const testDir = path.resolve("temp-test-dir");
  const testFile = path.resolve(testDir, "example.txt");
  const testSubDir = path.resolve(testDir, "subdir");

  before(async () => {
    // Cleanup any leftovers
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {}
  });

  after(async () => {
    // Cleanup
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {}
  });

  it("should write and read a file successfully", async () => {
    const content = "Hello Modern FS!";
    await writeFile(testFile, content);

    const readContent = await readFile(testFile);
    assert.strictEqual(readContent, content);
  });

  it("should check path status correctly (file, dir, exists)", async () => {
    await fs.mkdir(testSubDir, { recursive: true });

    // Check file status
    const fileStatus = await getPathStatus(testFile);
    assert.strictEqual(fileStatus.exists, true);
    assert.strictEqual(fileStatus.isFile, true);
    assert.strictEqual(fileStatus.isDirectory, false);
    assert.strictEqual(fileStatus.isReadable, true);
    assert.strictEqual(fileStatus.isWritable, true);

    // Check directory status
    const dirStatus = await getPathStatus(testSubDir);
    assert.strictEqual(dirStatus.exists, true);
    assert.strictEqual(dirStatus.isFile, false);
    assert.strictEqual(dirStatus.isDirectory, true);

    // Check non-existent path
    const nonExistentStatus = await getPathStatus(
      path.resolve(testDir, "ghost.txt"),
    );
    assert.strictEqual(nonExistentStatus.exists, false);
  });

  it("should handle reading non-existent file with custom error message", async () => {
    const ghostPath = path.resolve(testDir, "ghost.txt");
    await assert.rejects(
      () => readFile(ghostPath),
      (err: any) => {
        return err.message.includes(
          `fs-async.ts error: Failed to read ${ghostPath}`,
        );
      },
    );
  });

  it("should remove paths correctly", async () => {
    // Test file removal
    await removePath(testFile);
    const fileStatus = await getPathStatus(testFile);
    assert.strictEqual(fileStatus.exists, false);

    // Test directory removal
    await removePath(testSubDir);
    const dirStatus = await getPathStatus(testSubDir);
    assert.strictEqual(dirStatus.exists, false);
  });

  it("should check symlink status (if supported by OS/permissions)", async () => {
    const symlinkPath = path.resolve(testDir, "link-to-readme.md");
    const targetPath = path.resolve("README.md");

    try {
      // Create a symlink for testing
      await fs.symlink(targetPath, symlinkPath);

      const status = await getPathStatus(symlinkPath);
      assert.strictEqual(status.exists, true);
      assert.strictEqual(status.isSymbolicLink, true);

      // Cleanup symlink
      await fs.unlink(symlinkPath);
    } catch (e: any) {
      if (e.code === "EPERM") {
        // Skip link test if no permissions (common on Windows without dev mode)
        console.warn("Skipping symlink test due to lack of permissions");
      } else {
        throw e;
      }
    }
  });
});
