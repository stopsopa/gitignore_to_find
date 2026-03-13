import { test } from "node:test";
import path from "node:path";
import assert from "node:assert";
import fs from "node:fs/promises";
import diskStructuresCreate from "./diskStructuresCreate.ts";
import diskStructuresEmptyDir from "./diskStructuresEmptyDir.ts";
import diskStructuresListDir from "./diskStructuresListDir.ts";

const rootDir = path.resolve(import.meta.dirname, "../../");

const tmpDir = path.resolve(rootDir, "var/createRemoveTest");

/**
 * /bin/bash ts.sh --test src/gitignore_to_find/diskStructures.test.ts
 */
test("create and remove", async () => {

  try {
    await fs.mkdir(tmpDir, { recursive: true });
  } catch (error) {
    // attempt create might fail if it's a file
  }

  await diskStructuresEmptyDir(tmpDir);

  let listBefore = await diskStructuresListDir(tmpDir);

  assert.strictEqual(listBefore.length, 0);

  await diskStructuresCreate(
    tmpDir,
    `
directory/test/file.txt
directory/test/file2.txt
directory/test2/file3.txt
directory/test2/file4.txt
`,
  );

  let listAfter = await diskStructuresListDir(tmpDir);

  assert.deepStrictEqual(listAfter, [
    "directory/test/file.txt",
    "directory/test/file2.txt",
    "directory/test2/file3.txt",
    "directory/test2/file4.txt",
  ]);

  debugger;

  await diskStructuresEmptyDir(tmpDir);

  let listAfter2 = await diskStructuresListDir(tmpDir);

  assert.deepStrictEqual(listAfter2, []);
});
